const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const { body, validationResult } = require("express-validator");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

router.post(
    "/register",
    body("username").notEmpty().withMessage("Username is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { username, email, password } = req.body;
            const existingUser = await pool.query(
                "SELECT * FROM users WHERE email=$1 OR username=$2",
                [email.toLowerCase(), username.trim()]
            );
            if (existingUser.rows.length > 0) {
                return res.status(400).json({ error: "User already exists" });
            }

            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);

            const result = await pool.query(
                "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email",
                [username.trim(), email.toLowerCase(), hash]
            );

            const user = result.rows[0];
            const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

            res.status(201).json({ user, token });
        } catch (err) {
            res.status(500).json({ error: "Registration failed" });
        }
    }
);

router.post("/login", async (req, res) => {
    try {
        const { emailOrUsername, password } = req.body;
        console.log("📥 Login request body:", req.body);

        const val = emailOrUsername.trim().toLowerCase();
        const userRes = await pool.query(
            "SELECT id, username, email, password_hash FROM users WHERE LOWER(email) = $1 OR LOWER(username) = $1",
            [val]
        );

        if (!userRes.rows.length) {
            console.log("❌ No user found for:", val);
            return res.status(400).json({ error: "Invalid credentials" });
        }

        const user = userRes.rows[0];
        console.log("✅ User found:", user);

        const match = await bcrypt.compare(password, user.password_hash);
        console.log("🔑 Password match result:", match);

        if (!match) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        console.log("🎟️ Token issued for user:", user.username);

        res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
    } catch (err) {
        console.error("🔥 Login error:", err);
        res.status(500).json({ error: "Login failed" });
    }
});

module.exports = router;
