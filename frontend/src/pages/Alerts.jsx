/* eslint-disable no-empty */
import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { toast, ToastContainer } from "react-toastify";
import AsyncSelect from "react-select/async";
import "react-toastify/dist/ReactToastify.css";
import "./Alerts.css";

function Alerts() {
  const { token } = useContext(AuthContext);
  const { theme } = useTheme();
  const [alerts, setAlerts] = useState([]);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [targetPrice, setTargetPrice] = useState("");
  const [direction, setDirection] = useState("above");
  const [loading, setLoading] = useState(false);
  const prevAlertsRef = useRef([]);
  const [editingId, setEditingId] = useState(null);
  const [editPrice, setEditPrice] = useState("");

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

  const fetchAlerts = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/alerts", {
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
    } catch {}
  };

  const createAlert = async (e) => {
    e.preventDefault();
    if (!selectedCoin || !targetPrice) return;
    setLoading(true);
    try {
      await axios.post(
        "http://localhost:4000/api/alerts",
        { coin_id: selectedCoin.value, target_price: targetPrice, direction },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedCoin(null);
      setTargetPrice("");
      setDirection("above");
      fetchAlerts();
    } catch {}
    setLoading(false);
  };

  const deleteAlert = async (id) => {
    try {
      await axios.delete(`http://localhost:4000/api/alerts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAlerts();
    } catch {}
  };

  const startEdit = (alert) => {
    setEditingId(alert.id);
    setEditPrice(alert.target_price);
  };

  const saveEdit = async (id) => {
    try {
      await axios.put(
        `http://localhost:4000/api/alerts/${id}`,
        { price: editPrice },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingId(null);
      setEditPrice("");
      fetchAlerts();
    } catch {
      toast.error("Failed to update alert");
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="alerts-container">
      <h2>📢 Price Alerts</h2>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        theme={theme === "dark" ? "dark" : "light"}
      />
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
            menuPortalTarget={
              typeof document !== "undefined" ? document.body : null
            }
            menuPlacement="auto"
            styles={{
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              control: (base) => ({
                ...base,
                backgroundColor: theme === "dark" ? "#1e1e1e" : "#fff",
                borderColor: theme === "dark" ? "#444" : "#ccc",
                color: theme === "dark" ? "#fff" : "#000",
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
                color: theme === "dark" ? "#fff" : "#000",
              }),
              singleValue: (base) => ({
                ...base,
                color: theme === "dark" ? "#fff" : "#000",
              }),
              placeholder: (base) => ({
                ...base,
                color: theme === "dark" ? "#aaa" : "#666",
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
        {alerts.length === 0 ? (
          <p>No alerts created yet.</p>
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
    </div>
  );
}

export default Alerts;
