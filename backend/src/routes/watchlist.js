const express = require("express");
const router = express.Router();
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, async (req, res) => {
    try {
        const { coin_id } = req.body;
        const user_id = parseInt(req.userId, 10);

        const result = await pool.query(
            `INSERT INTO watchlist (user_id, coin_id, created_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id, coin_id) DO NOTHING
       RETURNING coin_id`,
            [user_id, coin_id]
        );

        res.json(result.rows[0] || { message: "Already in watchlist" });
    } catch (err) {
        console.error("Error adding to watchlist:", err.message);
        res.status(500).json({ error: "Failed to add to watchlist" });
    }
});

router.get("/", authMiddleware, async (req, res) => {
    try {
        const user_id = parseInt(req.userId, 10);
        const result = await pool.query(
            `SELECT coin_id 
       FROM watchlist 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
            [user_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching watchlist:", err.message);
        res.status(500).json({ error: "Failed to fetch watchlist" });
    }
});

router.delete("/:coin_id", authMiddleware, async (req, res) => {
    try {
        const { coin_id } = req.params;
        const user_id = parseInt(req.userId, 10);
        await pool.query(
            `DELETE FROM watchlist 
       WHERE user_id = $1 AND coin_id = $2`,
            [user_id, coin_id]
        );

        res.json({ message: "Removed from watchlist" });
    } catch (err) {
        console.error("Error removing from watchlist:", err.message);
        res.status(500).json({ error: "Failed to remove from watchlist" });
    }
});

module.exports = router;
