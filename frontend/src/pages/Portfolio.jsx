import React, { useEffect, useState } from "react";
import axios from "axios";
import Select from "react-select";
import "./Portfolio.css";

function Portfolio() {
  const [holdings, setHoldings] = useState([]);
  const [coinId, setCoinId] = useState(null);
  const [amount, setAmount] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [coins, setCoins] = useState([]);

  // ✅ Fetch coins (with prices)
  useEffect(() => {
    const fetchCoins = async () => {
      try {
        const res = await axios.get(
          "http://localhost:4000/api/coingecko/coins"
        );
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
  }, []);

  // ✅ Fetch holdings
  const fetchHoldings = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/portfolio");
      setHoldings(res.data);
    } catch (err) {
      console.error("Error fetching holdings:", err);
    }
  };

  useEffect(() => {
    fetchHoldings();
  }, []);

  // ✅ Add holding
  const handleAddHolding = async (e) => {
    e.preventDefault();

    if (!coinId || !amount || !buyPrice) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      await axios.post("http://localhost:4000/api/portfolio", {
        coin_id: coinId.value,
        amount: parseFloat(amount),
        buy_price: parseFloat(buyPrice),
      });
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

  // ✅ Calculate Portfolio Summary
  const summary = holdings.reduce(
    (acc, h) => {
      const coin = coins.find((c) => c.value === h.coin_id);
      const totalValue = parseFloat(h.amount) * parseFloat(h.buy_price);
      const currentValue = coin ? parseFloat(h.amount) * coin.current_price : 0;

      acc.investment += totalValue;
      acc.current += currentValue;
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

      {/* ✅ Portfolio Summary */}
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

      {/* ✅ Add Holding Form */}
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
            menu: (base) => ({ ...base, backgroundColor: "#2a2a2a" }),
            option: (base, { isFocused, isSelected }) => ({
              ...base,
              backgroundColor: isSelected
                ? "#3a3a3a"
                : isFocused
                ? "#333"
                : "#2a2a2a",
              color: "#fff",
              cursor: "pointer",
            }),
            placeholder: (base) => ({ ...base, color: "#aaa" }),
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

      {/* ✅ Holdings List */}
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
                <th>Total Value</th>
                <th>Profit/Loss</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((h) => {
                const coin = coins.find((c) => c.value === h.coin_id);
                const totalValue =
                  parseFloat(h.amount) * parseFloat(h.buy_price);
                const currentValue = coin
                  ? parseFloat(h.amount) * coin.current_price
                  : 0;
                const profitLoss = currentValue - totalValue;
                const profitLossPercent =
                  ((currentValue - totalValue) / totalValue) * 100;

                return (
                  <tr key={h.id}>
                    <td
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      {coin?.image && (
                        <img
                          src={coin.image}
                          alt={coin.label}
                          style={{ width: 24, height: 24, borderRadius: "50%" }}
                        />
                      )}
                      <span>{coin?.label || h.coin_id}</span>
                    </td>
                    <td>{parseFloat(h.amount).toLocaleString()}</td>
                    <td>${parseFloat(h.buy_price).toFixed(2)}</td>
                    <td>
                      $
                      {totalValue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td
                      style={{
                        color: profitLoss >= 0 ? "limegreen" : "red",
                        fontWeight: "bold",
                      }}
                    >
                      {profitLoss >= 0 ? "+" : ""}
                      {profitLoss.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      ({profitLossPercent.toFixed(2)}%)
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Portfolio;
