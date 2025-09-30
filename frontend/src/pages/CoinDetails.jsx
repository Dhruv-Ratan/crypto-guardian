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
  Title,
  TimeScale,
} from "chart.js";
import "chartjs-adapter-date-fns";
import { AuthContext } from "../context/AuthContext";
import "./CoinDetails.css";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Title,
  TimeScale
);

function CoinDetails() {
  const { id } = useParams();
  const { token } = useContext(AuthContext);
  const [coin, setCoin] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState("30");
  const [watchlistMsg, setWatchlistMsg] = useState("");
  const [error, setError] = useState(null);

  const base = import.meta.env.VITE_API_BASE || "http://localhost:4000";

  const fetchCoinData = async () => {
    try {
      setError(null);

      const [marketRes, detailRes] = await Promise.all([
        axios.get(`${base}/api/market-data?ids=${id}`),
        axios.get(`${base}/api/coin/${id}`),
      ]);

      const marketCoin = marketRes.data[0] || {};
      const detailCoin = detailRes.data;

      setCoin({
        ...detailCoin,
        market_data: detailCoin.market_data || {
          current_price: { usd: marketCoin?.current_price || 0 },
          market_cap: { usd: marketCoin?.market_cap || 0 },
          price_change_percentage_24h:
            marketCoin?.price_change_percentage_24h || 0,
          total_volume: { usd: marketCoin?.total_volume || 0 },
        },
        image: detailCoin.image || { large: marketCoin?.image },
        symbol: detailCoin.symbol || marketCoin?.symbol || "",
        name: detailCoin.name || marketCoin?.name || id,
      });
    } catch (err) {
      console.error("Error fetching coin details:", err.message);
      setError("Failed to fetch coin details.");
    }
  };

  const fetchHistoricalData = async (days) => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get(`${base}/api/coin/${id}/market-chart`, {
        params: { days },
      });

      if (!res.data?.prices || res.data.prices.length === 0) {
        setChartData(null);
        return;
      }

      // ✅ Handle both formats: [timestamp, price] OR {price, idx}
      const prices = res.data.prices.map((p, i) => {
        if (Array.isArray(p)) {
          return { x: p[0], y: Number(p[1]) };
        } else {
          return { x: i, y: Number(p.price) };
        }
      });

      const firstPrice = prices[0].y;
      const lastPrice = prices[prices.length - 1].y;
      const isUp = lastPrice >= firstPrice;

      const lineColor = isUp ? "rgb(0, 200, 83)" : "rgb(244, 67, 54)";
      const fillColor = isUp
        ? "rgba(0, 200, 83, 0.2)"
        : "rgba(244, 67, 54, 0.2)";

      setChartData({
        datasets: [
          {
            label: `${id} (last ${days} days)`,
            data: prices,
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
      setError("Failed to fetch historical data.");
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
      await axios.post(
        `${base}/api/watchlist`,
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
      {error && <p className="error-msg">{error}</p>}

      {!coin ? (
        <p>Loading coin details...</p>
      ) : (
        <>
          <h2>
            {coin.name} ({coin.symbol.toUpperCase()})
          </h2>
          {coin.image?.large && (
            <img src={coin.image.large} alt={coin.name} width={80} />
          )}
          {coin.description?.en && (
            <p
              dangerouslySetInnerHTML={{
                __html: coin.description.en.split(".")[0] || "",
              }}
            ></p>
          )}

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
                  tooltip: {
                    mode: "index",
                    intersect: false,
                    callbacks: {
                      label: (context) =>
                        `$${context.parsed.y.toLocaleString()}`,
                    },
                  },
                },
                scales: {
                  x: {
                    type:
                      chartData.datasets[0].data[0].x > 1000000000000
                        ? "time" // timestamp (ms)
                        : "linear", // index
                    time: {
                      unit:
                        timeframe === "7"
                          ? "hour"
                          : timeframe === "30"
                          ? "day"
                          : timeframe === "90"
                          ? "week"
                          : "month",
                    },
                    ticks: { maxTicksLimit: 8 },
                  },
                  y: {
                    beginAtZero: false,
                    ticks: {
                      callback: (value) => `$${value.toLocaleString()}`,
                    },
                  },
                },
              }}
            />
          ) : (
            <p>No chart data available</p>
          )}
        </>
      )}
    </div>
  );
}

export default CoinDetails;
