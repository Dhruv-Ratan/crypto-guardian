import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./Trending.css";

function Trending() {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTrending = async () => {
    try {
      const res = await axios.get("/api/coingecko/trending");
      setTrending(res.data.coins || []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching trending coins:", err);
    }
  };

  useEffect(() => {
    fetchTrending();
  }, []);

  return (
    <div className="trending-container">
      <h2>🔥 Trending Coins</h2>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="trending-grid">
          {trending.map((item, idx) => {
            const coin = item.item;
            return (
              <Link
                to={`/coin/${coin.id}`}
                key={coin.id}
                className="trending-card"
              >
                <span className="trend-rank">#{idx + 1}</span>
                <img src={coin.small} alt={coin.name} width="30" />
                <div>
                  <p className="coin-name">
                    {coin.name} ({coin.symbol.toUpperCase()})
                  </p>
                  <p className="coin-rank">Rank #{coin.market_cap_rank}</p>
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
