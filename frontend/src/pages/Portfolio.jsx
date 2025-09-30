import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import Select from "react-select";
import "./Portfolio.css";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

function Portfolio() {
  const [holdings, setHoldings] = useState([]);
  const [coinId, setCoinId] = useState(null);
  const [amount, setAmount] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [coins, setCoins] = useState([]);
  const [history, setHistory] = useState([]); // portfolio value over time
  const [pageLoading, setPageLoading] = useState(true); // ✅ overall loading
  const { token } = useContext(AuthContext);

  const base = import.meta.env.VITE_API_BASE || "http://localhost:4000";

  const COLORS = ["#16c784", "#f7931a", "#3773f5", "#ff007a", "#ffce56"];

  const formatCurrency = (num) =>
    num !== null && num !== undefined
      ? `$${Number(num).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      : "-";

  const formatNumber = (num) =>
    num !== null && num !== undefined
      ? Number(num).toLocaleString(undefined, { maximumFractionDigits: 4 })
      : "-";

  const selectStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: "#1c1c1c",
      borderColor: "#333",
      color: "#fff",
      boxShadow: "none",
      "&:hover": { borderColor: "#555" },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: "#1c1c1c",
      color: "#fff",
    }),
    option: (base, { isFocused, isSelected }) => ({
      ...base,
      backgroundColor: isSelected
        ? "#00c853"
        : isFocused
        ? "rgba(255, 255, 255, 0.1)"
        : "transparent",
      color: "#fff",
      cursor: "pointer",
    }),
    singleValue: (base) => ({
      ...base,
      color: "#fff",
    }),
    input: (base) => ({
      ...base,
      color: "#fff",
    }),
    placeholder: (base) => ({
      ...base,
      color: "#aaa",
    }),
  };

  useEffect(() => {
    const fetchCoins = async () => {
      try {
        const res = await axios.get(`${base}/api/coingecko/coins`);
        const formatted = res.data.map((coin) => ({
          value: coin.id,
          label: coin.name,
          image: coin.image,
          current_price: coin.current_price,
        }));
        setCoins(formatted);
      } catch (err) {
        console.error("Error fetching coins:", err);
        toast.error("❌ Failed to load coins.");
      }
    };
    fetchCoins();
  }, [base]);

  const fetchHoldings = async () => {
    try {
      setPageLoading(true);
      const res = await axios.get(`${base}/api/portfolio/holdings/enriched`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHoldings(res.data.holdings || res.data);
      setHistory(res.data.history || []); // backend should provide optional history
    } catch (err) {
      console.error("Error fetching holdings:", err);
      toast.error("❌ Failed to load portfolio.");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchHoldings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleAddHolding = async (e) => {
    e.preventDefault();
    if (!coinId || !amount || !buyPrice) {
      toast.warn("⚠️ Please fill all fields!");
      return;
    }
    setLoading(true);
    try {
      await axios.post(
        `${base}/api/portfolio/holdings`,
        {
          coinId: coinId.value.trim().toLowerCase(),
          amount: parseFloat(amount),
          buyPrice: parseFloat(buyPrice),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("✅ Holding added successfully!");
      setCoinId(null);
      setAmount("");
      setBuyPrice("");
      fetchHoldings();
    } catch (err) {
      console.error("Error adding holding:", err);
      toast.error("❌ Failed to add holding.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHolding = async (id) => {
    try {
      await axios.delete(`${base}/api/portfolio/holdings/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("✅ Holding deleted.");
      fetchHoldings();
    } catch (err) {
      console.error("Error deleting holding:", err);
      toast.error("❌ Failed to delete holding.");
    }
  };

  const summary = holdings.reduce(
    (acc, h) => {
      acc.investment += h.invested || 0;
      acc.current += h.current_value || 0;
      return acc;
    },
    { investment: 0, current: 0 }
  );

  const netPL = summary.current - summary.investment;
  const netPLPercent =
    summary.investment > 0 ? (netPL / summary.investment) * 100 : 0;

  // Pie chart data
  const pieData = holdings.map((h) => ({
    name: h.coin_name,
    value: h.current_value,
  }));

  // ✅ Skeleton Components
  const SkeletonCard = () => (
    <div className="animate-pulse">
      <div className="h-4 w-24 bg-gray-300 rounded mb-2"></div>
      <div className="h-6 w-32 bg-gray-300 rounded"></div>
    </div>
  );

  const SkeletonTableRow = ({ index }) => (
    <tr key={index} className="animate-pulse">
      <td>
        <div className="h-4 w-24 bg-gray-300 rounded"></div>
      </td>
      <td>
        <div className="h-4 w-12 bg-gray-300 rounded"></div>
      </td>
      <td>
        <div className="h-4 w-16 bg-gray-300 rounded"></div>
      </td>
      <td>
        <div className="h-4 w-20 bg-gray-300 rounded"></div>
      </td>
      <td>
        <div className="h-4 w-20 bg-gray-300 rounded"></div>
      </td>
      <td>
        <div className="h-4 w-20 bg-gray-300 rounded"></div>
      </td>
      <td>
        <div className="h-4 w-16 bg-gray-300 rounded"></div>
      </td>
      <td>
        <div className="h-4 w-12 bg-gray-300 rounded"></div>
      </td>
      <td>
        <div className="h-6 w-16 bg-gray-300 rounded"></div>
      </td>
    </tr>
  );

  return (
    <div className="portfolio-container">
      <h2>📂 My Portfolio</h2>

      {/* Summary Cards */}
      <div className="portfolio-summary">
        {pageLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <AnimatePresence>
            <motion.div
              className="summary-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h4>Total Investment</h4>
              <p>{formatCurrency(summary.investment)}</p>
            </motion.div>
            <motion.div
              className="summary-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h4>Current Value</h4>
              <p>{formatCurrency(summary.current)}</p>
            </motion.div>
            <motion.div
              className="summary-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h4>Net P/L</h4>
              <p
                style={{
                  color: netPL >= 0 ? "limegreen" : "red",
                  fontWeight: "bold",
                }}
              >
                {netPL >= 0 ? "+" : ""}
                {netPL.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                ({netPLPercent.toFixed(2)}%)
              </p>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <h4>Portfolio Allocation</h4>
          {pageLoading ? (
            <div className="h-40 bg-gray-300 animate-pulse rounded"></div>
          ) : pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => entry.name}
                >
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => `$${Number(value).toLocaleString()}`}
                  contentStyle={{
                    backgroundColor: "#1e1e1e",
                    border: "none",
                    borderRadius: "6px",
                    color: "#fff",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p>No holdings yet.</p>
          )}
        </div>

        <div className="chart-card">
          <h4>Portfolio Value Over Time</h4>
          {pageLoading ? (
            <div className="h-40 bg-gray-300 animate-pulse rounded"></div>
          ) : history.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={history}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value) => `$${Number(value).toLocaleString()}`}
                  contentStyle={{
                    backgroundColor: "#1e1e1e",
                    border: "none",
                    borderRadius: "6px",
                    color: "#fff",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#16c784"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p>No transaction history yet.</p>
          )}
        </div>
      </div>

      {/* Add Holding Form */}
      <form onSubmit={handleAddHolding} className="portfolio-form">
        <Select
          options={coins}
          value={coinId}
          onChange={setCoinId}
          placeholder="🔍 Search & Select Coin"
          isSearchable
          styles={selectStyles}
          formatOptionLabel={(coin) => (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <img
                src={coin.image}
                alt={coin.label}
                style={{ width: 20, height: 20, borderRadius: "50%" }}
              />
              <span>{coin.label}</span>
            </div>
          )}
        />
        <input
          type="number"
          step="0.0001"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <input
          type="number"
          step="0.01"
          placeholder="Buy Price (USD)"
          value={buyPrice}
          onChange={(e) => setBuyPrice(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Adding..." : "Add Holding"}
        </button>
      </form>

      {/* Holdings Table */}
      <div className="portfolio-list">
        {pageLoading ? (
          <table className="holdings-table">
            <thead>
              <tr>
                <th>Coin</th>
                <th>Amount</th>
                <th>Buy Price</th>
                <th>Invested</th>
                <th>Current Price</th>
                <th>Current Value</th>
                <th>Profit/Loss</th>
                <th>P/L %</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, idx) => (
                <SkeletonTableRow key={idx} index={idx} />
              ))}
            </tbody>
          </table>
        ) : holdings.length === 0 ? (
          <p>No holdings yet.</p>
        ) : (
          <table className="holdings-table">
            <thead>
              <tr>
                <th>Coin</th>
                <th>Amount</th>
                <th>Buy Price</th>
                <th>Invested</th>
                <th>Current Price</th>
                <th>Current Value</th>
                <th>Profit/Loss</th>
                <th>P/L %</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {holdings.map((h, idx) => (
                  <motion.tr
                    key={h.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, delay: idx * 0.05 }}
                  >
                    <td className="coin-cell">
                      {h.image && (
                        <img
                          src={h.image}
                          alt={h.coin_name}
                          style={{ width: 24, height: 24, borderRadius: "50%" }}
                        />
                      )}
                      <span>{h.coin_name}</span> ({h.symbol?.toUpperCase()})
                    </td>
                    <td>{formatNumber(h.amount)}</td>
                    <td>{formatCurrency(h.buy_price)}</td>
                    <td>{formatCurrency(h.invested)}</td>
                    <td>{formatCurrency(h.current_price)}</td>
                    <td>{formatCurrency(h.current_value)}</td>
                    <td
                      style={{
                        color: h.profit_loss >= 0 ? "limegreen" : "red",
                        fontWeight: "bold",
                      }}
                    >
                      {h.profit_loss !== null && h.profit_loss !== undefined
                        ? `${h.profit_loss >= 0 ? "+" : ""}${formatCurrency(
                            h.profit_loss
                          )}`
                        : "-"}
                    </td>
                    <td
                      style={{
                        color: h.profit_loss_percent >= 0 ? "limegreen" : "red",
                        fontWeight: "bold",
                      }}
                    >
                      {h.profit_loss_percent !== null &&
                      h.profit_loss_percent !== undefined
                        ? `${Number(h.profit_loss_percent).toFixed(2)}%`
                        : "-"}
                    </td>
                    <td>
                      <button
                        onClick={() => handleDeleteHolding(h.id)}
                        className="delete-btn"
                      >
                        🗑 Delete
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Portfolio;
