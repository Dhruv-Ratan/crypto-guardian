import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Dashboard.css";

function Dashboard() {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    try {
      const res = await axios.get("/api/coingecko/top?vs_currency=usd");
      setCoins(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching crypto data:", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); 
    return () => clearInterval(interval);
  }, []);

  const filteredCoins = coins.filter(
    (coin) =>
      coin.name.toLowerCase().includes(search.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(search.toLowerCase())
  );

  const renderChange = (value) => {
    if (value == null) return "—";
    const arrow = value >= 0 ? "↑" : "↓";
    const cls = value >= 0 ? "positive-change" : "negative-change";
    return <span className={cls}>{arrow} {value.toFixed(2)}%</span>;
  };

  return (
    <div className="dashboard-container">
      <h2>📊 Crypto Dashboard</h2>

      <input
        type="text"
        placeholder="Search coin (e.g., bitcoin, solana, dogecoin)..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="search-bar"
      />

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="crypto-table">
          <thead>
            <tr>
              <th>Coin</th>
              <th>Price (USD)</th>
              <th>24h Change</th>
              <th>7d Change</th>
              <th>Market Cap</th>
              <th>Volume (24h)</th>
            </tr>
          </thead>
          <tbody>
            {filteredCoins.map((coin) => (
              <tr key={coin.id}>
                <td>
                  <img
                    src={coin.image}
                    alt={coin.name}
                    width="20"
                    style={{ marginRight: "8px", verticalAlign: "middle" }}
                  />
                  {coin.name.toUpperCase()}
                </td>
                <td>${coin.current_price?.toLocaleString()}</td>
                <td>{renderChange(coin.price_change_percentage_24h)}</td>
                <td>{renderChange(coin.price_change_percentage_7d_in_currency)}</td>
                <td>${coin.market_cap?.toLocaleString() || "—"}</td>
                <td>${coin.total_volume?.toLocaleString() || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Dashboard;