import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import "./CoinDetails.css";

function CoinDetails() {
  const { id } = useParams();
  const [coin, setCoin] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCoin = useCallback(async () => {
    try {
      const res = await axios.get(`/api/coingecko/coin/${id}`);
      setCoin(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching coin details:", err);
    }
  }, [id]);

  useEffect(() => {
    fetchCoin();
  }, [fetchCoin]);

  if (loading) return <p>Loading...</p>;
  if (!coin) return <p>No data available</p>;

  return (
    <div className="coin-details-container">
      <div className="coin-header">
        <img src={coin.image.small} alt={coin.name} />
        <h2>
          {coin.name} ({coin.symbol.toUpperCase()})
        </h2>
      </div>

      <div className="coin-stats">
        <p>
          <strong>Current Price:</strong> $
          {coin.market_data.current_price.usd.toLocaleString()}
        </p>
        <p>
          <strong>Market Cap:</strong> $
          {coin.market_data.market_cap.usd.toLocaleString()}
        </p>
        <p>
          <strong>24h Volume:</strong> $
          {coin.market_data.total_volume.usd.toLocaleString()}
        </p>
        <p>
          <strong>24h Change:</strong>{" "}
          {coin.market_data.price_change_percentage_24h.toFixed(2)}%
        </p>
        <p>
          <strong>7d Change:</strong>{" "}
          {coin.market_data.price_change_percentage_7d?.toFixed(2) || "—"}%
        </p>
        <p>
          <strong>All-Time High:</strong> $
          {coin.market_data.ath.usd.toLocaleString()}
        </p>
      </div>

      <h3>📈 7-Day Price Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={coin.market_data.sparkline_7d.price.map((p, i) => ({
            price: p,
            idx: i,
          }))}
        >
          <Tooltip
            formatter={(value) => [`$${value.toFixed(2)}`, "Price"]}
            contentStyle={{
              backgroundColor: "#1e1e1e",
              border: "none",
              borderRadius: "6px",
              color: "#fff",
              fontSize: "12px",
            }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={
              coin.market_data.price_change_percentage_7d >= 0
                ? "#16c784"
                : "#ea3943"
            }
            fill={
              coin.market_data.price_change_percentage_7d >= 0
                ? "#16c78433"
                : "#ea394333"
            }
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="coin-description">
        <h3>ℹ️ About {coin.name}</h3>
        <p
          dangerouslySetInnerHTML={{
            __html: coin.description.en.split(". ")[0] + ".",
          }}
        />
      </div>
    </div>
  );
}

export default CoinDetails;
