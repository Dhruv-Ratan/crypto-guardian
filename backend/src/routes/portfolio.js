const express = require("express");
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM portfolio WHERE user_id=$1 ORDER BY id DESC",
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

router.post("/", authMiddleware, async (req, res) => {
    try {
        const { coin_id, amount, buy_price } = req.body;
        const result = await pool.query(
            "INSERT INTO portfolio (coin_id, amount, buy_price, user_id) VALUES ($1, $2, $3, $4) RETURNING *",
            [coin_id, amount, buy_price, req.user.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

module.exports = router;
