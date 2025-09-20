import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Portfolio.css";

function Portfolio() {
  const [holdings, setHoldings] = useState([]);
  const [coinId, setCoinId] = useState("");
  const [amount, setAmount] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [prices, setPrices] = useState({});
  const [allCoins, setAllCoins] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  const userId = 1;

  const fetchPortfolio = async () => {
    try {
      const res = await axios.get(`/api/portfolio/${userId}`);
      setHoldings(res.data);
    } catch (err) {
      console.error("Error fetching portfolio:", err);
    }
  };

  const fetchPrices = async () => {
    if (holdings.length === 0) return;
    try {
      const ids = holdings.map((h) => h.coin_id).join(",");
      const res = await axios.get(
        `/api/coingecko/price?ids=${ids}&vs_currency=usd`
      );
      setPrices(res.data);
    } catch (err) {
      console.error("Error fetching live prices:", err);
    }
  };

  const fetchCoinList = async () => {
    try {
      const res = await axios.get(
        "https://api.coingecko.com/api/v3/coins/list"
      );
      setAllCoins(res.data);
    } catch (err) {
      console.error("Error fetching coin list:", err);
    }
  };

  useEffect(() => {
    fetchPortfolio();
    fetchCoinList();
  }, []);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holdings]);

  const handleCoinChange = (e) => {
    const value = e.target.value;
    setCoinId(value);
    if (value.length > 0) {
      const filtered = allCoins
        .filter(
          (c) =>
            c.id.toLowerCase().includes(value.toLowerCase()) ||
            c.symbol.toLowerCase().includes(value.toLowerCase())
        )
        .slice(0, 6);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (coin) => {
    setCoinId(coin.id);
    setSuggestions([]);
  };

  const addHolding = async (e) => {
    e.preventDefault();
    if (!coinId || !amount || !buyPrice) {
      alert("Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      await axios.post("/api/portfolio/add", {
        user_id: userId,
        coin_id: coinId.toLowerCase(),
        amount: parseFloat(amount),
        buy_price: parseFloat(buyPrice),
      });
      setCoinId("");
      setAmount("");
      setBuyPrice("");
      fetchPortfolio();
    } catch (err) {
      console.error("Error adding holding:", err);
      alert("Failed to add holding");
    } finally {
      setLoading(false);
    }
  };

  const deleteHolding = async (id) => {
    try {
      await axios.delete(`/api/portfolio/${id}`);
      fetchPortfolio();
    } catch (err) {
      console.error("Error deleting holding:", err);
    }
  };

  const summary = holdings.reduce(
    (acc, h) => {
      const livePrice = prices[h.coin_id]?.usd || 0;
      const invested = h.amount * h.buy_price;
      const currentValue = h.amount * livePrice;
      acc.invested += invested;
      acc.currentValue += currentValue;
      return acc;
    },
    { invested: 0, currentValue: 0 }
  );
  summary.profitLoss = summary.currentValue - summary.invested;
  summary.profitLossPercent =
    summary.invested > 0 ? (summary.profitLoss / summary.invested) * 100 : 0;

  return (
    <div className="portfolio-container">
      <h2>💼 My Portfolio</h2>

      <form className="portfolio-form" onSubmit={addHolding}>
        <div className="autocomplete">
          <input
            type="text"
            placeholder="Search coin (e.g., bitcoin)"
            value={coinId}
            onChange={handleCoinChange}
          />
          {suggestions.length > 0 && (
            <ul className="suggestions-list">
              {suggestions.map((coin) => (
                <li key={coin.id} onClick={() => selectSuggestion(coin)}>
                  {coin.name} ({coin.symbol.toUpperCase()})
                </li>
              ))}
            </ul>
          )}
        </div>
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <input
          type="number"
          placeholder="Buy Price (USD)"
          value={buyPrice}
          onChange={(e) => setBuyPrice(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Adding..." : "Add Holding"}
        </button>
      </form>

      {holdings.length > 0 ? (
        <div className="table-wrapper">
          <table className="portfolio-table">
            <thead>
              <tr>
                <th>Coin</th>
                <th>Amount</th>
                <th>Buy Price</th>
                <th>Invested ($)</th>
                <th>Current Price</th>
                <th>Current Value</th>
                <th>P/L ($)</th>
                <th>P/L %</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((h) => {
                const livePrice = prices[h.coin_id]?.usd || 0;
                const invested = h.amount * h.buy_price;
                const currentValue = h.amount * livePrice;
                const profitLoss = currentValue - invested;
                const profitLossPercent =
                  invested > 0 ? (profitLoss / invested) * 100 : 0;

                return (
                  <tr key={h.id}>
                    <td>{h.coin_id.toUpperCase()}</td>
                    <td>{h.amount}</td>
                    <td>${h.buy_price}</td>
                    <td>${invested.toLocaleString()}</td>
                    <td>${livePrice ? livePrice.toLocaleString() : "—"}</td>
                    <td>
                      ${currentValue ? currentValue.toLocaleString() : "—"}
                    </td>
                    <td
                      className={
                        profitLoss >= 0 ? "positive-change" : "negative-change"
                      }
                    >
                      {profitLoss.toFixed(2)}
                    </td>
                    <td
                      className={
                        profitLossPercent >= 0
                          ? "positive-change"
                          : "negative-change"
                      }
                    >
                      {profitLossPercent.toFixed(2)}%
                    </td>
                    <td>
                      <button
                        className="delete-btn"
                        onClick={() => deleteHolding(h.id)}
                      >
                        ❌ Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="summary-row">
                <td colSpan="3">TOTAL</td>
                <td>${summary.invested.toLocaleString()}</td>
                <td>—</td>
                <td>${summary.currentValue.toLocaleString()}</td>
                <td
                  className={
                    summary.profitLoss >= 0
                      ? "positive-change"
                      : "negative-change"
                  }
                >
                  {summary.profitLoss.toFixed(2)}
                </td>
                <td
                  className={
                    summary.profitLossPercent >= 0
                      ? "positive-change"
                      : "negative-change"
                  }
                >
                  {summary.profitLossPercent.toFixed(2)}%
                </td>
                <td>—</td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <p>No holdings yet. Add one above 👆</p>
      )}
    </div>
  );
}

export default Portfolio;
