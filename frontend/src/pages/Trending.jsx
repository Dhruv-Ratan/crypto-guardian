import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./Trending.css";

function Trending() {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTrending = async () => {
    try {
      const res = await axios.get("/api/coingecko/trending");
      setTrending(res.data.coins);
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
          {trending.map((coin, index) => (
            <Link
              key={coin.item.id}
              to={`/coin/${coin.item.id}`}
              className="trending-card"
            >
              <span className="trend-rank">#{index + 1}</span>
              <img
                src={coin.item.small}
                alt={coin.item.name}
                width="32"
                height="32"
              />
              <div>
                <p className="coin-name">
                  {coin.item.name} ({coin.item.symbol.toUpperCase()})
                </p>
                <p className="coin-rank">
                  Market Cap Rank: #{coin.item.market_cap_rank}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Trending;
