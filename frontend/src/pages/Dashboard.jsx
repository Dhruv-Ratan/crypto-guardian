import React, { useEffect, useState, useContext, useMemo } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AuthContext } from "../context/AuthContext";
import { WatchlistContext } from "../context/WatchlistContext";
import { toast } from "react-toastify";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import "./Dashboard.css";

function Dashboard() {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [globalData, setGlobalData] = useState(null);
  const [globalLoading, setGlobalLoading] = useState(true);
  const [showWatchlistOnly, setShowWatchlistOnly] = useState(false);
  const [visibleCoins, setVisibleCoins] = useState(20);

  const { token } = useContext(AuthContext);
  const { watchlist, addToWatchlist, removeFromWatchlist, fetchWatchlist } =
    useContext(WatchlistContext);

  const base = import.meta.env.VITE_API_BASE || "http://localhost:4000";
  let toastShown = false;

  const downsample = (arr, points = 30) => {
    if (!arr || arr.length === 0) return [];
    const step = Math.ceil(arr.length / points);
    return arr
      .filter((_, idx) => idx % step === 0)
      .map((p, i) => ({ price: p, idx: i }));
  };

  const fetchData = async () => {
    try {
      const res = await axios.get(`${base}/api/market-data`);
      const processed = res.data.map((coin) => ({
        ...coin,
        sparkline_processed: coin.sparkline_in_7d
          ? downsample(coin.sparkline_in_7d.price)
          : null,
      }));
      setCoins(processed);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching crypto data:", err);
      toast.error("❌ Failed to fetch market data.");
    }
  };

  const fetchGlobalData = async () => {
    try {
      const res = await axios.get(`${base}/api/coingecko/global`);
      setGlobalData(res.data.data);
      setGlobalLoading(false);
      toastShown = false;
    } catch (err) {
      console.error("Error fetching global market data:", err);
      if (!toastShown) {
        toast.error("❌ Failed to fetch global stats.");
        toastShown = true;
      }
    }
  };

  const toggleWatchlist = (coin_id) => {
    if (!token) {
      toast.warn("⚠️ Please login to manage your watchlist.");
      return;
    }
    if (watchlist.includes(coin_id)) {
      removeFromWatchlist(coin_id);
      toast.info(`Removed ${coin_id} from Watchlist`);
    } else {
      addToWatchlist(coin_id);
      toast.success(`Added ${coin_id} to Watchlist`);
    }
  };

  useEffect(() => {
    fetchData();
    fetchGlobalData();
    fetchWatchlist();
    const interval = setInterval(() => {
      fetchData();
      fetchGlobalData();
    }, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredCoins = useMemo(() => {
    return coins.filter((coin) => {
      const matchesSearch =
        coin.name.toLowerCase().includes(search.toLowerCase()) ||
        coin.symbol.toLowerCase().includes(search.toLowerCase());
      const matchesWatchlist = showWatchlistOnly
        ? watchlist.includes(coin.id)
        : true;
      return matchesSearch && matchesWatchlist;
    });
  }, [coins, search, showWatchlistOnly, watchlist]);

  const coinsToRender = filteredCoins.slice(0, visibleCoins);

  const renderChange = (value) => {
    if (value == null) return "—";
    const arrow = value >= 0 ? "↑" : "↓";
    const cls = value >= 0 ? "positive-change" : "negative-change";
    return (
      <span className={cls}>
        {arrow} {value.toFixed(2)}%
      </span>
    );
  };

  // Skeleton for global stats card
  const SkeletonStatCard = () => (
    <div className="stat-card animate-pulse">
      <div className="h-4 w-24 bg-gray-300 rounded mb-2"></div>
      <div className="h-6 w-32 bg-gray-300 rounded"></div>
    </div>
  );

  // Skeleton for table row
  const SkeletonRow = ({ index }) => (
    <tr key={index} className="animate-pulse">
      <td>
        <div className="h-4 w-6 bg-gray-300 rounded"></div>
      </td>
      <td>
        <div className="h-4 w-4 bg-gray-300 rounded-full mx-auto"></div>
      </td>
      <td>
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 bg-gray-300 rounded-full"></div>
          <div className="h-4 w-24 bg-gray-300 rounded"></div>
        </div>
      </td>
      <td>
        <div className="h-4 w-16 bg-gray-300 rounded"></div>
      </td>
      <td>
        <div className="h-4 w-12 bg-gray-300 rounded"></div>
      </td>
      <td>
        <div className="h-4 w-12 bg-gray-300 rounded"></div>
      </td>
      <td>
        <div className="h-4 w-20 bg-gray-300 rounded"></div>
      </td>
      <td>
        <div className="h-4 w-20 bg-gray-300 rounded"></div>
      </td>
      <td>
        <div className="h-8 w-32 bg-gray-300 rounded"></div>
      </td>
    </tr>
  );

  return (
    <div className="dashboard-container">
      <h2>📊 Crypto Dashboard</h2>

      {/* Global Stats Section */}
      <div className="stats-grid">
        {globalLoading ? (
          <>
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </>
        ) : (
          <AnimatePresence>
            {globalData && (
              <>
                {[
                  {
                    title: "Global Market Cap",
                    value: `$${globalData.total_market_cap.usd.toLocaleString()}`,
                  },
                  {
                    title: "24h Volume",
                    value: `$${globalData.total_volume.usd.toLocaleString()}`,
                  },
                  {
                    title: "BTC Dominance",
                    value: `${globalData.market_cap_percentage.btc.toFixed(
                      2
                    )}%`,
                  },
                  {
                    title: "Active Cryptos",
                    value: globalData.active_cryptocurrencies,
                  },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.title}
                    className="stat-card"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                  >
                    <h4>{stat.title}</h4>
                    <p>{stat.value}</p>
                  </motion.div>
                ))}
              </>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Filters */}
      <div className="dashboard-filters">
        <input
          type="text"
          placeholder="Search coin..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-bar"
        />
        {token && (
          <label className="watchlist-filter">
            <input
              type="checkbox"
              checked={showWatchlistOnly}
              onChange={(e) => setShowWatchlistOnly(e.target.checked)}
            />
            Show Watchlist Only
          </label>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <table className="crypto-table">
          <thead>
            <tr>
              <th>S No</th>
              <th>⭐</th>
              <th>Coin</th>
              <th>Price (USD)</th>
              <th>24h Change</th>
              <th>7d Change</th>
              <th>Market Cap</th>
              <th>Volume (24h)</th>
              <th>7d Trend</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 10 }).map((_, idx) => (
              <SkeletonRow key={idx} index={idx} />
            ))}
          </tbody>
        </table>
      ) : coinsToRender.length === 0 ? (
        <p>No coins found.</p>
      ) : (
        <>
          <table className="crypto-table">
            <thead>
              <tr>
                <th>S No</th>
                <th>⭐</th>
                <th>Coin</th>
                <th>Price (USD)</th>
                <th>24h Change</th>
                <th>7d Change</th>
                <th>Market Cap</th>
                <th>Volume (24h)</th>
                <th>7d Trend</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {coinsToRender.map((coin, index) => (
                  <motion.tr
                    key={coin.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.02 }}
                  >
                    <td>{index + 1}</td>
                    <td>
                      <button
                        className={`watchlist-toggle ${
                          watchlist.includes(coin.id) ? "active" : ""
                        }`}
                        onClick={() => toggleWatchlist(coin.id)}
                      >
                        {watchlist.includes(coin.id) ? "★" : "☆"}
                      </button>
                    </td>
                    <td>
                      <Link to={`/coin/${coin.id}`} className="coin-link">
                        <img
                          src={coin.image}
                          alt={coin.name}
                          width="20"
                          style={{
                            marginRight: "8px",
                            verticalAlign: "middle",
                          }}
                        />
                        {coin.name} ({coin.symbol.toUpperCase()})
                      </Link>
                    </td>
                    <td>${coin.current_price?.toLocaleString() || "—"}</td>
                    <td>{renderChange(coin.price_change_percentage_24h)}</td>
                    <td>
                      {renderChange(
                        coin.price_change_percentage_7d_in_currency
                      )}
                    </td>
                    <td>${coin.market_cap?.toLocaleString() || "—"}</td>
                    <td>${coin.total_volume?.toLocaleString() || "—"}</td>
                    <td style={{ width: "140px", height: "50px" }}>
                      {coin.sparkline_processed ? (
                        <ResponsiveContainer width="100%" height={50}>
                          <LineChart data={coin.sparkline_processed}>
                            <Tooltip
                              formatter={(value) => [
                                `$${value.toFixed(2)}`,
                                "Price",
                              ]}
                              contentStyle={{
                                backgroundColor: "#1e1e1e",
                                border: "none",
                                borderRadius: "6px",
                                color: "#fff",
                                fontSize: "12px",
                              }}
                              cursor={{ stroke: "#ccc", strokeWidth: 1 }}
                            />
                            <Line
                              type="monotone"
                              dataKey="price"
                              stroke={
                                coin.price_change_percentage_7d_in_currency >= 0
                                  ? "#16c784"
                                  : "#ea3943"
                              }
                              strokeWidth={2}
                              dot={false}
                            />
                            <XAxis hide />
                            <YAxis hide domain={["auto", "auto"]} />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        "—"
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>

          {visibleCoins < filteredCoins.length && (
            <div style={{ textAlign: "center", marginTop: "15px" }}>
              <button
                onClick={() => setVisibleCoins((prev) => prev + 20)}
                style={{
                  background: "var(--primary-color)",
                  color: "#fff",
                  border: "none",
                  padding: "10px 18px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Load More
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Dashboard;
