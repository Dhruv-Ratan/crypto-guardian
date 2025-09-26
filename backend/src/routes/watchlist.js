const express = require("express");
const router = express.Router();
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, async (req, res) => {
    try {
        const { coin_id } = req.body;
        const user_id = req.userId;

        const result = await pool.query(
            `INSERT INTO watchlist (user_id, coin_id) 
       VALUES ($1, $2) 
       ON CONFLICT (user_id, coin_id) DO NOTHING
       RETURNING *`,
            [user_id, coin_id]
        );

        res.json(result.rows[0] || { message: "Already in watchlist" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to add to watchlist" });
    }
});
router.get("/", authMiddleware, async (req, res) => {
    try {
        const user_id = req.userId;
        const result = await pool.query(
            `SELECT * FROM watchlist WHERE user_id = $1 ORDER BY created_at DESC`,
            [user_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch watchlist" });
    }
});
router.delete("/:coin_id", authMiddleware, async (req, res) => {
    try {
        const { coin_id } = req.params;
        const user_id = req.userId;

        await pool.query(
            `DELETE FROM watchlist WHERE user_id = $1 AND coin_id = $2`,
            [user_id, coin_id]
        );

        res.json({ message: "Removed from watchlist" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to remove from watchlist" });
    }
});

module.exports = router;
