/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { toast, ToastContainer } from "react-toastify";
import AsyncSelect from "react-select/async";
import { useNavigate } from "react-router-dom";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import "react-toastify/dist/ReactToastify.css";
import "./Alerts.css";

function Alerts() {
  const { token } = useContext(AuthContext);
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState([]);
  const [triggeredAlerts, setTriggeredAlerts] = useState([]);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [targetPrice, setTargetPrice] = useState("");
  const [direction, setDirection] = useState("above");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [tab, setTab] = useState("active");

  const prevAlertsRef = useRef([]);
  const [editingId, setEditingId] = useState(null);
  const [editPrice, setEditPrice] = useState("");

  const base = import.meta.env.VITE_API_BASE || "http://localhost:4000";

  const loadCoinOptions = async (inputValue) => {
    if (!inputValue || inputValue.length < 1) return [];
    try {
      const res = await axios.get(
        `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(
          inputValue
        )}`
      );
      return res.data.coins.map((coin) => ({
        value: coin.id,
        label: `${coin.name} (${coin.symbol.toUpperCase()})`,
      }));
    } catch {
      return [];
    }
  };

  const fetchActiveAlerts = async () => {
    try {
      const res = await axios.get(`${base}/api/alerts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const newAlerts = res.data;
      newAlerts.forEach((alert) => {
        const old = prevAlertsRef.current.find((a) => a.id === alert.id);
        if (alert.triggered && old && !old.triggered) {
          toast.success(
            `🚨 ${alert.coin_id} alert triggered at $${alert.target_price}!`
          );
        }
      });
      prevAlertsRef.current = newAlerts;
      setAlerts(newAlerts);
    } catch (err) {
      console.error("Error fetching active alerts:", err);
      toast.error("❌ Failed to load active alerts.");
    } finally {
      setPageLoading(false);
    }
  };

  const fetchTriggeredAlerts = async () => {
    try {
      const res = await axios.get(`${base}/api/alerts/triggered`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTriggeredAlerts(res.data);
    } catch (err) {
      console.error("Error fetching triggered alerts:", err);
      toast.error("❌ Failed to load triggered alerts.");
    }
  };

  const clearTriggeredAlerts = async () => {
    try {
      await axios.delete(`${base}/api/alerts/triggered`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.info("🗑️ Triggered alerts cleared");
      fetchTriggeredAlerts();
    } catch {
      toast.error("Failed to clear history");
    }
  };

  const createAlert = async (e) => {
    e.preventDefault();
    if (!selectedCoin || !targetPrice) return;
    setLoading(true);
    try {
      await axios.post(
        `${base}/api/alerts`,
        { coin_id: selectedCoin.value, target_price: targetPrice, direction },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedCoin(null);
      setTargetPrice("");
      setDirection("above");
      fetchActiveAlerts();
    } catch (err) {
      console.error("Error creating alert:", err);
      toast.error("❌ Failed to create alert.");
    }
    setLoading(false);
  };

  const deleteAlert = async (id) => {
    try {
      await axios.delete(`${base}/api/alerts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchActiveAlerts();
    } catch {
      toast.error("❌ Failed to delete alert.");
    }
  };

  const startEdit = (alert) => {
    setEditingId(alert.id);
    setEditPrice(alert.target_price);
  };

  const saveEdit = async (id) => {
    try {
      await axios.put(
        `${base}/api/alerts/${id}`,
        { price: editPrice },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingId(null);
      setEditPrice("");
      fetchActiveAlerts();
    } catch {
      toast.error("Failed to update alert");
    }
  };

  useEffect(() => {
    if (!token) {
      toast.error("⚠️ Please log in to manage alerts.");
      navigate("/login");
      return;
    }
    fetchActiveAlerts();
    fetchTriggeredAlerts();
    const interval = setInterval(() => {
      fetchActiveAlerts();
      fetchTriggeredAlerts();
    }, 10000);
    return () => clearInterval(interval);
  }, [token]);

  return (
    <div className="alerts-container">
      <h2>📢 Price Alerts</h2>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        theme={theme === "dark" ? "dark" : "light"}
      />

      {/* Tab Switcher */}
      <div className="alerts-tabs">
        <button
          className={tab === "active" ? "active" : ""}
          onClick={() => setTab("active")}
        >
          Active Alerts
        </button>
        <button
          className={tab === "triggered" ? "active" : ""}
          onClick={() => setTab("triggered")}
        >
          Triggered Alerts
        </button>
      </div>

      {tab === "active" && (
        <>
          <form onSubmit={createAlert} className="alerts-form">
            <div className="coin-select" style={{ minWidth: 280 }}>
              <AsyncSelect
                cacheOptions
                loadOptions={loadCoinOptions}
                defaultOptions={false}
                value={selectedCoin}
                onChange={setSelectedCoin}
                placeholder="Search coin..."
                isClearable
                styles={{
                  control: (base) => ({
                    ...base,
                    backgroundColor: theme === "dark" ? "#1e1e1e" : "#fff",
                    borderColor: theme === "dark" ? "#444" : "#ccc",
                  }),
                  input: (base) => ({
                    ...base,
                    color: theme === "dark" ? "#fff" : "#000",
                  }),
                  menu: (base) => ({
                    ...base,
                    backgroundColor: theme === "dark" ? "#1e1e1e" : "#fff",
                  }),
                  option: (base, { isFocused, isSelected }) => ({
                    ...base,
                    backgroundColor: isSelected
                      ? theme === "dark"
                        ? "#333"
                        : "#ddd"
                      : isFocused
                      ? theme === "dark"
                        ? "#444"
                        : "#eee"
                      : "transparent",
                  }),
                }}
              />
            </div>
            <input
              type="number"
              placeholder="Target Price (USD)"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
            />
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
            >
              <option value="above">Above</option>
              <option value="below">Below</option>
            </select>
            <button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Add Alert"}
            </button>
          </form>

          <div className="alerts-list">
            {pageLoading ? (
              <Skeleton
                count={5}
                height={30}
                style={{ marginBottom: "10px" }}
              />
            ) : alerts.length === 0 ? (
              <p>No active alerts.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Coin</th>
                    <th>Target Price</th>
                    <th>Direction</th>
                    <th>Status</th>
                    <th>Edit</th>
                    <th>Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((alert) => (
                    <tr key={alert.id}>
                      <td>{alert.coin_id}</td>
                      <td>
                        {editingId === alert.id ? (
                          <input
                            type="number"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                          />
                        ) : (
                          `$${alert.target_price}`
                        )}
                      </td>
                      <td>{alert.direction}</td>
                      <td>{alert.triggered ? "✅ Triggered" : "⏳ Pending"}</td>
                      <td>
                        {editingId === alert.id ? (
                          <>
                            <button
                              className="save-btn"
                              onClick={() => saveEdit(alert.id)}
                            >
                              Save
                            </button>
                            <button
                              className="cancel-btn"
                              onClick={() => setEditingId(null)}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            className="edit-btn"
                            onClick={() => startEdit(alert)}
                          >
                            ✏️
                          </button>
                        )}
                      </td>
                      <td>
                        <button
                          className="delete-btn"
                          onClick={() => deleteAlert(alert.id)}
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
        </>
      )}

      {tab === "triggered" && (
        <div className="alerts-list">
          <div style={{ textAlign: "right", marginBottom: "10px" }}>
            <button onClick={clearTriggeredAlerts} className="clear-btn">
              🗑️ Clear History
            </button>
          </div>
          {pageLoading ? (
            <Skeleton count={5} height={30} style={{ marginBottom: "10px" }} />
          ) : triggeredAlerts.length === 0 ? (
            <p>No triggered alerts yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Coin</th>
                  <th>Target Price</th>
                  <th>Direction</th>
                  <th>Triggered At</th>
                </tr>
              </thead>
              <tbody>
                {triggeredAlerts.map((alert) => (
                  <tr key={alert.id}>
                    <td>{alert.coin_id}</td>
                    <td>${alert.target_price}</td>
                    <td>{alert.direction}</td>
                    <td>
                      {alert.triggered_at
                        ? new Date(alert.triggered_at).toLocaleString()
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default Alerts;
