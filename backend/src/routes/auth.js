const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

router.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const result = await pool.query(
            "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email",
            [username, email, hash]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Registration error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const userRes = await pool.query("SELECT * FROM users WHERE email=$1", [
            email,
        ]);

        if (userRes.rows.length === 0)
            return res.status(400).json({ error: "Invalid credentials" });

        const user = userRes.rows[0];
        const validPass = await bcrypt.compare(password, user.password_hash);

        if (!validPass)
            return res.status(400).json({ error: "Invalid credentials" });

        const token = jwt.sign(
            { id: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Login failed" });
    }
});

module.exports = router;
