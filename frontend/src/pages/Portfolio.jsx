import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import Select from "react-select";
import "./Portfolio.css";
import { AuthContext } from "../context/AuthContext";

function Portfolio() {
  const [holdings, setHoldings] = useState([]);
  const [coinId, setCoinId] = useState(null);
  const [amount, setAmount] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [coins, setCoins] = useState([]);
  const { token } = useContext(AuthContext);

  const base = import.meta.env.VITE_API_BASE || "http://localhost:4000";

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
      }
    };
    fetchCoins();
  }, [base]);

  const fetchHoldings = async () => {
    try {
      const res = await axios.get(`${base}/api/portfolio/holdings/enriched`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHoldings(res.data);
    } catch (err) {
      console.error("Error fetching holdings:", err);
    }
  };

  useEffect(() => {
    if (token) fetchHoldings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleAddHolding = async (e) => {
    e.preventDefault();
    if (!coinId || !amount || !buyPrice) {
      alert("Please fill all fields");
      return;
    }
    setLoading(true);
    try {
      await axios.post(
        `${base}/api/portfolio/holdings`,
        {
          coinId: coinId.value,
          amount: parseFloat(amount),
          buyPrice: parseFloat(buyPrice),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCoinId(null);
      setAmount("");
      setBuyPrice("");
      fetchHoldings();
    } catch (err) {
      console.error("Error adding holding:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHolding = async (id) => {
    try {
      await axios.delete(`${base}/api/portfolio/holdings/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchHoldings();
    } catch (err) {
      console.error("Error deleting holding:", err);
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

  return (
    <div className="portfolio-container">
      <h2>My Portfolio</h2>

      {holdings.length > 0 && (
        <div className="portfolio-summary">
          <div>
            <h4>Total Investment</h4>
            <p>
              $
              {summary.investment.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <div>
            <h4>Current Value</h4>
            <p>
              $
              {summary.current.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <div>
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
          </div>
        </div>
      )}

      <form onSubmit={handleAddHolding} className="portfolio-form">
        <Select
          options={coins}
          value={coinId}
          onChange={setCoinId}
          placeholder="🔍 Search & Select Coin"
          isSearchable
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
          styles={{
            control: (base) => ({
              ...base,
              backgroundColor: "#1e1e1e",
              borderColor: "#444",
              color: "#fff",
              boxShadow: "none",
              "&:hover": { borderColor: "#888" },
            }),
            singleValue: (base) => ({ ...base, color: "#fff" }),
            input: (base) => ({ ...base, color: "#fff" }),
            menu: (base) => ({
              ...base,
              backgroundColor: "#1e1e1e",
              border: "1px solid #333",
            }),
            option: (base, { isFocused, isSelected }) => ({
              ...base,
              backgroundColor: isSelected
                ? "#333"
                : isFocused
                ? "#2a2a2a"
                : "#1e1e1e",
              color: "#fff",
              cursor: "pointer",
            }),
            placeholder: (base) => ({ ...base, color: "#aaa" }),
            dropdownIndicator: (base) => ({
              ...base,
              color: "#aaa",
              "&:hover": { color: "#fff" },
            }),
            indicatorSeparator: () => ({ display: "none" }),
            valueContainer: (base) => ({ ...base, color: "#fff" }),
          }}
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

      <div className="portfolio-list">
        {holdings.length === 0 ? (
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
              {holdings.map((h) => (
                <tr key={h.id}>
                  <td
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {h.image && (
                      <img
                        src={h.image}
                        alt={h.coin_name}
                        style={{ width: 24, height: 24, borderRadius: "50%" }}
                      />
                    )}
                    <span>{h.coin_name}</span> ({h.symbol?.toUpperCase()})
                  </td>
                  <td>{Number(h.amount).toLocaleString()}</td>
                  <td>
                    {h.buy_price !== null && h.buy_price !== undefined
                      ? `$${Number(h.buy_price).toFixed(2)}`
                      : "-"}
                  </td>
                  <td>
                    {h.invested !== null && h.invested !== undefined
                      ? `$${Number(h.invested).toFixed(2)}`
                      : "-"}
                  </td>
                  <td>
                    {h.current_price !== null && h.current_price !== undefined
                      ? `$${Number(h.current_price).toFixed(2)}`
                      : "-"}
                  </td>
                  <td>
                    {h.current_value !== null && h.current_value !== undefined
                      ? `$${Number(h.current_value).toFixed(2)}`
                      : "-"}
                  </td>
                  <td
                    style={{
                      color: h.profit_loss > 0 ? "limegreen" : "red",
                      fontWeight: "bold",
                    }}
                  >
                    {h.profit_loss !== null && h.profit_loss !== undefined
                      ? `${h.profit_loss >= 0 ? "+" : ""}$${Number(
                          h.profit_loss
                        ).toFixed(2)}`
                      : "-"}
                  </td>
                  <td
                    style={{
                      color: h.profit_loss_percent > 0 ? "limegreen" : "red",
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
                      style={{
                        background: "red",
                        color: "white",
                        border: "none",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Portfolio;
