const express = require("express");
const router = express.Router();
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, async (req, res) => {
    try {
        const { coin_id, target_price, direction } = req.body;
        const user_id = req.userId;

        const result = await pool.query(
            `INSERT INTO alerts (user_id, coin_id, target_price, direction) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
            [user_id, coin_id, target_price, direction]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create alert" });
    }
});

router.get("/", authMiddleware, async (req, res) => {
    try {
        const user_id = req.userId;
        const result = await pool.query(
            `SELECT * FROM alerts WHERE user_id = $1 ORDER BY created_at DESC`,
            [user_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch alerts" });
    }
});

router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.userId;

        await pool.query(`DELETE FROM alerts WHERE id = $1 AND user_id = $2`, [
            id,
            user_id,
        ]);

        res.json({ message: "Alert deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete alert" });
    }
});

router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const { price } = req.body;
        const { id } = req.params;

        if (!price || isNaN(price)) {
            return res.status(400).json({ error: "Valid price is required" });
        }

        const result = await pool.query(
            "UPDATE alerts SET target_price=$1 WHERE id=$2 AND user_id=$3 RETURNING *",
            [price, id, req.userId]
        );

        if (result.rows.length === 0) {
            return res
                .status(404)
                .json({ error: "Alert not found or unauthorized" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update alert" });
    }
});

module.exports = router;
