/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import { AuthContext } from "../context/AuthContext";
import "./CoinDetails.css";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

function CoinDetails() {
  const { id } = useParams();
  const { token } = useContext(AuthContext);
  const [coin, setCoin] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("30");
  const [watchlistMsg, setWatchlistMsg] = useState("");

  const fetchCoinData = async () => {
    try {
      const res = await axios.get(
        `https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`
      );
      setCoin(res.data);
    } catch (err) {
      console.error("Error fetching coin details:", err.message);
    }
  };

  const fetchHistoricalData = async (days) => {
    try {
      setLoading(true);
      const res = await axios.get(
        `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}`
      );
      const prices = res.data.prices.map((p) => ({
        x: new Date(p[0]).toLocaleDateString(),
        y: p[1],
      }));

      if (prices.length === 0) return;

      const firstPrice = prices[0].y;
      const lastPrice = prices[prices.length - 1].y;
      const isUp = lastPrice >= firstPrice;

      const lineColor = isUp ? "rgb(0, 200, 83)" : "rgb(244, 67, 54)";
      const fillColor = isUp
        ? "rgba(0, 200, 83, 0.2)"
        : "rgba(244, 67, 54, 0.2)";

      setChartData({
        labels: prices.map((p) => p.x),
        datasets: [
          {
            label: `${id} (last ${days} days)`,
            data: prices.map((p) => p.y),
            borderColor: lineColor,
            backgroundColor: fillColor,
            pointRadius: 0,
            fill: true,
            tension: 0.3,
          },
        ],
      });
    } catch (err) {
      console.error("Error fetching historical data:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const addToWatchlist = async () => {
    if (!token) {
      setWatchlistMsg("⚠️ Please login to add coins to your watchlist.");
      return;
    }
    try {
      const res = await axios.post(
        "http://localhost:4000/api/watchlist",
        { coin_id: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWatchlistMsg("✅ Added to Watchlist!");
    } catch (err) {
      console.error(
        "Error adding to watchlist:",
        err.response?.data || err.message
      );
      setWatchlistMsg("❌ Failed to add to watchlist.");
    }
  };

  useEffect(() => {
    fetchCoinData();
    fetchHistoricalData(timeframe);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, timeframe]);

  return (
    <div className="coin-details-container">
      {coin ? (
        <>
          <h2>
            {coin.name} ({coin.symbol.toUpperCase()})
          </h2>
          <img src={coin.image.large} alt={coin.name} width={80} />
          <p
            dangerouslySetInnerHTML={{
              __html: coin.description.en.split(".")[0],
            }}
          ></p>

          <div className="stats-grid">
            <div className="stat-card">
              <h4>Price</h4>
              <p>${coin.market_data.current_price.usd.toLocaleString()}</p>
            </div>
            <div className="stat-card">
              <h4>24h Change</h4>
              <p
                style={{
                  color:
                    coin.market_data.price_change_percentage_24h >= 0
                      ? "rgb(0, 200, 83)"
                      : "rgb(244, 67, 54)",
                }}
              >
                {coin.market_data.price_change_percentage_24h.toFixed(2)}%
              </p>
            </div>
            <div className="stat-card">
              <h4>Market Cap</h4>
              <p>${coin.market_data.market_cap.usd.toLocaleString()}</p>
            </div>
            <div className="stat-card">
              <h4>24h Volume</h4>
              <p>${coin.market_data.total_volume.usd.toLocaleString()}</p>
            </div>
          </div>

          <button className="watchlist-btn" onClick={addToWatchlist}>
            ⭐ Add to Watchlist
          </button>
          {watchlistMsg && <p className="watchlist-msg">{watchlistMsg}</p>}

          <h3>Price Chart</h3>

          <div className="timeframe-buttons">
            {["7", "30", "90", "365"].map((d) => (
              <button
                key={d}
                onClick={() => setTimeframe(d)}
                className={timeframe === d ? "active" : ""}
              >
                {d === "365" ? "1Y" : `${d}D`}
              </button>
            ))}
          </div>

          {loading ? (
            <p>Loading chart...</p>
          ) : chartData ? (
            <Line
              data={chartData}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: true },
                  tooltip: { mode: "index", intersect: false },
                },
                scales: {
                  x: { ticks: { maxTicksLimit: 10 } },
                  y: { beginAtZero: false },
                },
              }}
            />
          ) : (
            <p>No chart data available</p>
          )}
        </>
      ) : (
        <p>Loading coin details...</p>
      )}
    </div>
  );
}

export default CoinDetails;
