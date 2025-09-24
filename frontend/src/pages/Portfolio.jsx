import React, { useEffect, useState } from "react";
import api from "../api/axios"; // ✅ use axios wrapper with JWT interceptor
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
  const [fetching, setFetching] = useState(true);
  const [pricesLoading, setPricesLoading] = useState(false);

  // 🔹 Fetch portfolio (requires JWT)
  const fetchPortfolio = async () => {
    try {
      setFetching(true);
      const res = await api.get("/api/portfolio");
      setHoldings(res.data);
    } catch (err) {
      console.error("Error fetching portfolio:", err);
    } finally {
      setFetching(false);
    }
  };

  // 🔹 Fetch live prices
  const fetchPrices = async () => {
    if (holdings.length === 0) return;
    try {
      setPricesLoading(true);
      const ids = holdings.map((h) => h.coin_id).join(",");
      const res = await api.get(
        `/api/coingecko/price?ids=${ids}&vs_currency=usd`
      );
      setPrices(res.data);
    } catch (err) {
      console.error("Error fetching live prices:", err);
    } finally {
      setPricesLoading(false);
    }
  };

  // 🔹 Fetch coin list (for autocomplete)
  const fetchCoinList = async () => {
    try {
      const res = await api.get("/api/coingecko/coins/list");
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
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holdings.length]);

  // 🔹 Handle coin input with suggestions
  let searchTimeout;
  const handleCoinChange = (e) => {
    const value = e.target.value;
    setCoinId(value);

    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
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
    }, 300);
  };

  const selectSuggestion = (coin) => {
    setCoinId(coin.id);
    setSuggestions([]);
  };

  // 🔹 Add holding
  const addHolding = async (e) => {
    e.preventDefault();
    if (!coinId || !amount || !buyPrice) {
      alert("Please fill all fields");
      return;
    }
    if (parseFloat(amount) <= 0 || parseFloat(buyPrice) <= 0) {
      alert("Amount and Buy Price must be greater than 0");
      return;
    }

    try {
      setLoading(true);
      await api.post("/api/portfolio/add", {
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

  // 🔹 Delete holding
  const deleteHolding = async (id) => {
    try {
      await api.delete(`/api/portfolio/${id}`);
      fetchPortfolio();
    } catch (err) {
      console.error("Error deleting holding:", err);
    }
  };

  // 🔹 Summary calculations
  const summary = holdings.reduce(
    (acc, h) => {
      const livePrice = prices[h.coin_id]?.usd || 0;
      const invested = Number(h.amount) * Number(h.buy_price);
      const currentValue = Number(h.amount) * livePrice;
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

      {/* Add Holding Form */}
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
          min="0"
          step="any"
          onChange={(e) => setAmount(e.target.value)}
        />
        <input
          type="number"
          placeholder="Buy Price (USD)"
          value={buyPrice}
          min="0"
          step="any"
          onChange={(e) => setBuyPrice(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Adding..." : "Add Holding"}
        </button>
      </form>

      {/* Portfolio Table */}
      {fetching ? (
        <p>⏳ Loading portfolio...</p>
      ) : holdings.length > 0 ? (
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
                const invested = Number(h.amount) * Number(h.buy_price);
                const currentValue = Number(h.amount) * livePrice;
                const profitLoss = currentValue - invested;
                const profitLossPercent =
                  invested > 0 ? (profitLoss / invested) * 100 : 0;
                const coinMeta = allCoins.find((c) => c.id === h.coin_id);

                return (
                  <tr key={h.id}>
                    <td>
                      {coinMeta?.name || h.coin_id} (
                      {coinMeta?.symbol?.toUpperCase() || "N/A"})
                    </td>
                    <td>{h.amount}</td>
                    <td>${Number(h.buy_price).toFixed(2)}</td>
                    <td>
                      $
                      {invested.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td>
                      {pricesLoading
                        ? "⏳"
                        : livePrice
                        ? `$${livePrice.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                        : "—"}
                    </td>
                    <td>
                      {currentValue
                        ? `$${currentValue.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                        : "—"}
                    </td>
                    <td
                      className={
                        profitLoss > 0
                          ? "positive-change"
                          : profitLoss < 0
                          ? "negative-change"
                          : "neutral-change"
                      }
                    >
                      ${profitLoss.toFixed(2)}
                    </td>
                    <td
                      className={
                        profitLossPercent > 0
                          ? "positive-change"
                          : profitLossPercent < 0
                          ? "negative-change"
                          : "neutral-change"
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
                <td>
                  $
                  {summary.invested.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td>—</td>
                <td>
                  $
                  {summary.currentValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td
                  className={
                    summary.profitLoss > 0
                      ? "positive-change"
                      : summary.profitLoss < 0
                      ? "negative-change"
                      : "neutral-change"
                  }
                >
                  ${summary.profitLoss.toFixed(2)}
                </td>
                <td
                  className={
                    summary.profitLossPercent > 0
                      ? "positive-change"
                      : summary.profitLossPercent < 0
                      ? "negative-change"
                      : "neutral-change"
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
