import React, { useEffect, useState, useContext } from "react";
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
import "./Dashboard.css";

function Dashboard() {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [globalData, setGlobalData] = useState(null);

  const { token } = useContext(AuthContext);
  const { watchlist, addToWatchlist, removeFromWatchlist, fetchWatchlist } =
    useContext(WatchlistContext);

  const [showWatchlistOnly, setShowWatchlistOnly] = useState(false);

  const fetchData = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/market-data");
      setCoins(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching crypto data:", err);
    }
  };

  const fetchGlobalData = async () => {
    try {
      const res = await axios.get("https://api.coingecko.com/api/v3/global");
      setGlobalData(res.data.data);
    } catch (err) {
      console.error("Error fetching global market data:", err);
    }
  };

  const toggleWatchlist = (coin_id) => {
    if (!token) {
      alert("Please login to manage your watchlist.");
      return;
    }
    if (watchlist.includes(coin_id)) {
      removeFromWatchlist(coin_id);
    } else {
      addToWatchlist(coin_id);
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

  const filteredCoins = coins.filter((coin) => {
    const matchesSearch =
      coin.name.toLowerCase().includes(search.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(search.toLowerCase());
    const matchesWatchlist = showWatchlistOnly
      ? watchlist.includes(coin.id)
      : true;
    return matchesSearch && matchesWatchlist;
  });

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

  return (
    <div className="dashboard-container">
      <h2>📊 Crypto Dashboard</h2>

      {globalData && (
        <div className="stats-grid">
          <div className="stat-card">
            <h4>Global Market Cap</h4>
            <p>${globalData.total_market_cap.usd.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <h4>24h Volume</h4>
            <p>${globalData.total_volume.usd.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <h4>BTC Dominance</h4>
            <p>{globalData.market_cap_percentage.btc.toFixed(2)}%</p>
          </div>
          <div className="stat-card">
            <h4>Active Cryptos</h4>
            <p>{globalData.active_cryptocurrencies}</p>
          </div>
        </div>
      )}

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

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="crypto-table">
          <thead>
            <tr>
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
            {filteredCoins.map((coin) => (
              <tr key={coin.id} style={{ cursor: "pointer" }}>
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
                      style={{ marginRight: "8px", verticalAlign: "middle" }}
                    />
                    {coin.name.toUpperCase()} ({coin.symbol.toUpperCase()})
                  </Link>
                </td>
                <td>${coin.current_price?.toLocaleString() || "—"}</td>
                <td>{renderChange(coin.price_change_percentage_24h)}</td>
                <td>
                  {renderChange(coin.price_change_percentage_7d_in_currency)}
                </td>
                <td>${coin.market_cap?.toLocaleString() || "—"}</td>
                <td>${coin.total_volume?.toLocaleString() || "—"}</td>
                <td style={{ width: "140px", height: "50px" }}>
                  {coin.sparkline_in_7d ? (
                    <ResponsiveContainer width="100%" height={50}>
                      <LineChart
                        data={coin.sparkline_in_7d.price.map((p, i) => ({
                          price: p,
                          idx: i,
                        }))}
                      >
                        <defs>
                          <linearGradient
                            id="positiveGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#16c784"
                              stopOpacity={1}
                            />
                            <stop
                              offset="100%"
                              stopColor="#16c784"
                              stopOpacity={0.2}
                            />
                          </linearGradient>
                          <linearGradient
                            id="negativeGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#ea3943"
                              stopOpacity={1}
                            />
                            <stop
                              offset="100%"
                              stopColor="#ea3943"
                              stopOpacity={0.2}
                            />
                          </linearGradient>
                        </defs>

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
                          stroke={`url(#${
                            coin.price_change_percentage_7d_in_currency >= 0
                              ? "positiveGradient"
                              : "negativeGradient"
                          })`}
                          strokeWidth={2.5}
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
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Dashboard;
