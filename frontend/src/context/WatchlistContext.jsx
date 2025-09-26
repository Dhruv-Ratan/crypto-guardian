import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "./AuthContext";

// eslint-disable-next-line react-refresh/only-export-components
export const WatchlistContext = createContext();

export const WatchlistProvider = ({ children }) => {
  const { token } = useContext(AuthContext);
  const [watchlist, setWatchlist] = useState([]);

  const fetchWatchlist = async () => {
    if (!token) {
      setWatchlist([]);
      return;
    }
    try {
      const res = await axios.get("http://localhost:4000/api/watchlist", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWatchlist(res.data.map((c) => c.coin_id));
    } catch (err) {
      console.error("Error fetching watchlist:", err.message);
    }
  };

  const addToWatchlist = async (coin_id) => {
    if (!token) return;
    try {
      await axios.post(
        "http://localhost:4000/api/watchlist",
        { coin_id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWatchlist((prev) => [...new Set([...prev, coin_id])]);
    } catch (err) {
      console.error("Error adding to watchlist:", err.message);
    }
  };

  const removeFromWatchlist = async (coin_id) => {
    if (!token) return;
    try {
      await axios.delete(`http://localhost:4000/api/watchlist/${coin_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWatchlist((prev) => prev.filter((c) => c !== coin_id));
    } catch (err) {
      console.error("Error removing from watchlist:", err.message);
    }
  };

  useEffect(() => {
    fetchWatchlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <WatchlistContext.Provider
      value={{ watchlist, addToWatchlist, removeFromWatchlist, fetchWatchlist }}
    >
      {children}
    </WatchlistContext.Provider>
  );
};
