const express = require("express");
const pool = require("../db"); // make sure you have db.js with pg Pool
const router = express.Router();

// Get all holdings
router.get("/", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM portfolio ORDER BY id DESC");
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Add a holding
router.post("/", async (req, res) => {
    try {
        const { coin_id, amount, buy_price } = req.body;

        if (!coin_id || !amount || !buy_price) {
            return res.status(400).json({ error: "Missing fields" });
        }

        const result = await pool.query(
            "INSERT INTO portfolio (coin_id, amount, buy_price) VALUES ($1, $2, $3) RETURNING *",
            [coin_id, amount, buy_price]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

module.exports = router;
