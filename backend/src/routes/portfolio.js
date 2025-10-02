const express = require("express");
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const fetchWithCache = require("../coingeckoClient");

const router = express.Router();
const COINGECKO_API = "https://api.coingecko.com/api/v3";

router.post("/holdings", authMiddleware, async (req, res) => {
    try {
        const { coinId, amount, buyPrice } = req.body;
        const result = await pool.query(
            "INSERT INTO holdings (user_id, coin_id, amount, buy_price) VALUES ($1, $2, $3, $4) RETURNING *",
            [req.userId, coinId, amount, buyPrice]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Failed to add holding" });
    }
});

router.get("/holdings", authMiddleware, async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM holdings WHERE user_id=$1", [
            req.userId,
        ]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch holdings" });
    }
});

router.delete("/holdings/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            "DELETE FROM holdings WHERE id=$1 AND user_id=$2 RETURNING *",
            [id, req.userId]
        );
        if (result.rows.length === 0) {
            return res
                .status(404)
                .json({ error: "Holding not found or not authorized" });
        }
        res.json({ message: "Holding deleted", holding: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete holding" });
    }
});

router.put("/holdings/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, buyPrice } = req.body;
        const result = await pool.query(
            "UPDATE holdings SET amount=$1, buy_price=$2 WHERE id=$3 AND user_id=$4 RETURNING *",
            [amount, buyPrice, id, req.userId]
        );
        if (result.rows.length === 0) {
            return res
                .status(404)
                .json({ error: "Holding not found or not authorized" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Failed to update holding" });
    }
});

router.get("/holdings/enriched", authMiddleware, async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM holdings WHERE user_id=$1", [
            req.userId,
        ]);
        const holdings = result.rows;
        if (holdings.length === 0) {
            return res.json([]);
        }

        const coinIds = holdings.map((h) => h.coin_id).join(",");
        const data = await fetchWithCache(`${COINGECKO_API}/coins/markets`, {
            vs_currency: "usd",
            ids: coinIds,
            order: "market_cap_desc",
            per_page: holdings.length,
            page: 1,
            sparkline: false,
        });

        const enriched = holdings.map((h) => {
            const coin = data.find(
                (c) => c.id.toLowerCase().trim() === h.coin_id.toLowerCase().trim()
            );
            if (!coin) {
                return {
                    ...h,
                    coin_name: h.coin_id,
                    symbol: null,
                    image: null,
                    current_price: null,
                    current_value: null,
                    invested: h.buy_price !== null ? Number(h.amount) * Number(h.buyPrice) : null,
                    profit_loss: null,
                    profit_loss_percent: null,
                };
            }

            const currentValue = Number(h.amount) * coin.current_price;
            const invested =
                h.buy_price !== null ? Number(h.amount) * Number(h.buy_price) : null;
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
                profit_loss_percent:
                    invested && invested !== 0
                        ? ((profitLoss / invested) * 100).toFixed(2)
                        : null,
            };
        });

        res.json(enriched);
    } catch (err) {
        res
            .status(err.response?.status || 500)
            .json({ error: "Failed to enrich holdings" });
    }
});

router.get("/history", authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM holdings WHERE user_id=$1 ORDER BY created_at ASC",
            [req.userId]
        );
        const holdings = result.rows;
        if (holdings.length === 0) {
            return res.json([]);
        }

        const startDate = new Date(holdings[0].created_at);
        const today = new Date();
        const formatDate = (d) => d.toISOString().split("T")[0];
        const historyCache = {};

        for (const h of holdings) {
            if (!historyCache[h.coin_id]) {
                const data = await fetchWithCache(
                    `${COINGECKO_API}/coins/${h.coin_id}/market_chart`,
                    {
                        vs_currency: "usd",
                        days: "max",
                        interval: "daily",
                    }
                );
                historyCache[h.coin_id] = data.prices.map(([ts, price]) => ({
                    date: formatDate(new Date(ts)),
                    price,
                }));
            }
        }

        const history = [];
        for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
            const dateStr = formatDate(d);
            let dailyValue = 0;
            for (const h of holdings) {
                if (new Date(h.created_at) <= d) {
                    const prices = historyCache[h.coin_id];
                    const match = prices.find((p) => p.date === dateStr);
                    const priceAtDay = match ? match.price : h.buy_price;
                    dailyValue += Number(h.amount) * priceAtDay;
                }
            }
            history.push({ date: dateStr, value: dailyValue });
        }

        res.json(history);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch portfolio history" });
    }
});

module.exports = router;
