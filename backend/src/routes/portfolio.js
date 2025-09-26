const express = require("express");
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const axios = require("axios");
const NodeCache = require("node-cache");

const router = express.Router();
const cache = new NodeCache({ stdTTL: 60 });

router.post("/holdings", authMiddleware, async (req, res) => {
    try {
        const { coinId, amount, buyPrice } = req.body;
        console.log("DEBUG body:", req.body);
        console.log("DEBUG userId:", req.userId);

        const result = await pool.query(
            "INSERT INTO holdings (user_id, coin_id, amount, buy_price) VALUES ($1, $2, $3, $4) RETURNING *",
            [req.userId, coinId, amount, buyPrice]
        );

        console.log("DEBUG inserted:", result.rows[0]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error("DEBUG error adding holding:", err.message);
        res.status(500).json({ error: "Failed to add holding" });
    }
});

router.get("/holdings", authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const result = await pool.query("SELECT * FROM holdings WHERE user_id=$1", [userId]);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching holdings:", err.message);
        res.status(500).json({ error: "Failed to fetch holdings" });
    }
});

router.delete("/holdings/:id", authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;

        const result = await pool.query(
            "DELETE FROM holdings WHERE id=$1 AND user_id=$2 RETURNING *",
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Holding not found or not authorized" });
        }

        res.json({ message: "Holding deleted", holding: result.rows[0] });
    } catch (err) {
        console.error("Error deleting holding:", err.message);
        res.status(500).json({ error: "Failed to delete holding" });
    }
});

router.put("/holdings/:id", authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const { amount, buyPrice } = req.body;

        const result = await pool.query(
            "UPDATE holdings SET amount=$1, buy_price=$2 WHERE id=$3 AND user_id=$4 RETURNING *",
            [amount, buyPrice, id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Holding not found or not authorized" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error updating holding:", err.message);
        res.status(500).json({ error: "Failed to update holding" });
    }
});

router.get("/holdings/enriched", authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const result = await pool.query("SELECT * FROM holdings WHERE user_id=$1", [userId]);
        const holdings = result.rows;

        if (holdings.length === 0) {
            return res.json([]);
        }

        const coinIds = holdings.map((h) => h.coin_id).join(",");
        const cacheKey = `prices_${coinIds}`;

        let marketData = cache.get(cacheKey);
        if (!marketData) {
            console.log("Fetching from Coingecko API...");
            const { data } = await axios.get("https://api.coingecko.com/api/v3/coins/markets", {
                params: {
                    vs_currency: "usd",
                    ids: coinIds,
                    order: "market_cap_desc",
                    per_page: holdings.length,
                    page: 1,
                    sparkline: false,
                },
            });
            marketData = data;
            cache.set(cacheKey, marketData);
        } else {
            console.log("Serving prices from cache");
        }

        const enriched = holdings.map((h) => {
            const coin = marketData.find((c) => c.id === h.coin_id);
            if (!coin) {
                return { ...h, current_price: null, current_value: null, profit_loss: null };
            }

            const currentValue = Number(h.amount) * coin.current_price;
            const invested = h.buy_price ? Number(h.amount) * Number(h.buy_price) : null;
            const profitLoss = invested !== null ? currentValue - invested : null;

            return {
                ...h,
                coin_name: coin.name,
                symbol: coin.symbol,
                image: coin.image,
                current_price: coin.current_price,
                current_value: currentValue,
                invested,
                profit_loss: profitLoss,
                profit_loss_percent: invested
                    ? ((profitLoss / invested) * 100).toFixed(2)
                    : null,
            };
        });

        res.json(enriched);
    } catch (err) {
        console.error("Error enriching holdings:", err.message);
        res.status(err.response?.status || 500).json({ error: "Failed to enrich holdings" });
    }
});

module.exports = router;
