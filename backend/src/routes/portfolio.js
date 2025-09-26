const express = require("express");
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

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

module.exports = router;
