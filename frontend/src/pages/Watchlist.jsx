import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { WatchlistContext } from "../context/WatchlistContext";
import { Link } from "react-router-dom";
import "./Watchlist.css";

function Watchlist() {
  const { token } = useContext(AuthContext);
  const { watchlist, removeFromWatchlist, fetchWatchlist } =
    useContext(WatchlistContext);
  const [coinData, setCoinData] = useState([]);

  const base = import.meta.env.VITE_API_BASE || "http://localhost:4000";

  const fetchMarketData = async () => {
    if (!watchlist.length) {
      setCoinData([]);
      return;
    }
    try {
      const res = await axios.get(`${base}/api/market-data`, {
        params: { ids: watchlist.join(",") },
      });
      setCoinData(res.data);
    } catch (err) {
      console.error("Error fetching watchlist market data:", err.message);
    }
  };

  useEffect(() => {
    if (token) {
      fetchWatchlist();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    fetchMarketData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchlist]);

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
    <div className="watchlist-container">
      <h2>⭐ My Watchlist</h2>
      {coinData.length === 0 ? (
        <p>No coins in your watchlist yet.</p>
      ) : (
        <table className="watchlist-table">
          <thead>
            <tr>
              <th>Coin</th>
              <th>Price (USD)</th>
              <th>24h Change</th>
              <th>Market Cap</th>
              <th>Remove</th>
            </tr>
          </thead>
          <tbody>
            {coinData.map((coin) => (
              <tr key={coin.id}>
                <td>
                  <Link to={`/coin/${coin.id}`} className="coin-link">
                    <img
                      src={coin.image}
                      alt={coin.name}
                      width="20"
                      style={{ marginRight: "8px", verticalAlign: "middle" }}
                    />
                    {coin.name} ({coin.symbol.toUpperCase()})
                  </Link>
                </td>
                <td>${coin.current_price?.toLocaleString() || "—"}</td>
                <td>{renderChange(coin.price_change_percentage_24h)}</td>
                <td>${coin.market_cap?.toLocaleString() || "—"}</td>
                <td>
                  <button
                    onClick={() => removeFromWatchlist(coin.id)}
                    className="remove-btn"
                  >
                    ❌
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Watchlist;
