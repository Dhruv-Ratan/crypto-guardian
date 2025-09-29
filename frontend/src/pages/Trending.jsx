import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./Trending.css";

function Trending() {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  const base = import.meta.env.VITE_API_BASE || "http://localhost:4000";

  const fetchTrending = async () => {
    try {
      const res = await axios.get(`${base}/api/trending`);
      setTrending(res.data.coins || []);
    } catch (err) {
      console.error("Error fetching trending coins:", err.message);
      setTrending([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="trending-container">
      <h2>🔥 Trending Coins</h2>

      {loading ? (
        <p>Loading...</p>
      ) : trending.length === 0 ? (
        <p>No trending coins available.</p>
      ) : (
        <div className="trending-grid">
          {trending.map((coin, index) => {
            const item = coin.item;
            return (
              <Link
                key={item.id}
                to={`/coin/${item.id}`}
                className="trending-card"
              >
                <span className="trend-rank">#{index + 1}</span>
                <img src={item.small} alt={item.name} width="32" height="32" />
                <div>
                  <p className="coin-name">
                    {item.name} ({item.symbol?.toUpperCase()})
                  </p>
                  <p className="coin-rank">
                    Market Cap Rank: #{item.market_cap_rank || "N/A"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Trending;
