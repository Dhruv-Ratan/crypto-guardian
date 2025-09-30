const express = require("express");
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
    try {
        const { coin_id, target_price, direction } = req.body;

        if (!coin_id || !target_price || !direction) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const result = await pool.query(
            `INSERT INTO alerts (user_id, coin_id, target_price, direction, triggered, created_at)
       VALUES ($1, $2, $3, $4, false, NOW())
       RETURNING *`,
            [req.userId, coin_id, target_price, direction]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error creating alert:", err.message);
        res.status(500).json({ error: "Failed to create alert" });
    }
});

router.get("/", authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM alerts
       WHERE user_id = $1 AND triggered = false
       ORDER BY created_at DESC`,
            [req.userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching alerts:", err.message);
        res.status(500).json({ error: "Failed to fetch alerts" });
    }
});

router.get("/triggered", authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM alerts
       WHERE user_id = $1 AND triggered = true
       ORDER BY triggered_at DESC`,
            [req.userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching triggered alerts:", err.message);
        res.status(500).json({ error: "Failed to fetch triggered alerts" });
    }
});

router.delete("/triggered", authMiddleware, async (req, res) => {
    try {
        await pool.query(
            `DELETE FROM alerts WHERE user_id = $1 AND triggered = true`,
            [req.userId]
        );
        res.json({ message: "Triggered alerts cleared" });
    } catch (err) {
        console.error("Error clearing triggered alerts:", err.message);
        res.status(500).json({ error: "Failed to clear triggered alerts" });
    }
});

router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `DELETE FROM alerts
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
            [id, req.userId]
        );

        if (result.rows.length === 0) {
            return res
                .status(404)
                .json({ error: "Alert not found or not authorized" });
        }

        res.json({ message: "Alert deleted", alert: result.rows[0] });
    } catch (err) {
        console.error("Error deleting alert:", err.message);
        res.status(500).json({ error: "Failed to delete alert" });
    }
});

router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { price } = req.body;

        const result = await pool.query(
            `UPDATE alerts
       SET target_price = $1
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
            [price, id, req.userId]
        );

        if (result.rows.length === 0) {
            return res
                .status(404)
                .json({ error: "Alert not found or not authorized" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error updating alert:", err.message);
        res.status(500).json({ error: "Failed to update alert" });
    }
});

router.put("/:id/trigger", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `UPDATE alerts
       SET triggered = true, triggered_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
            [id, req.userId]
        );

        if (result.rows.length === 0) {
            return res
                .status(404)
                .json({ error: "Alert not found or not authorized" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error marking alert as triggered:", err.message);
        res.status(500).json({ error: "Failed to mark alert as triggered" });
    }
});

module.exports = router;
