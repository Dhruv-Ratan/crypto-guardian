const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const { body, validationResult } = require("express-validator");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

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
                [email, username]
            );
            if (existingUser.rows.length > 0) {
                return res.status(400).json({ error: "User already exists" });
            }

            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);

            const result = await pool.query(
                "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email",
                [username, email, hash]
            );

            res.status(201).json(result.rows[0]);
        } catch (err) {
            console.error("Registration error:", err.message);
            res.status(500).json({ error: "Registration failed" });
        }
    }
);

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const userRes = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
        if (userRes.rows.length === 0) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        const user = userRes.rows[0];
        const validPass = await bcrypt.compare(password, user.password_hash);

        if (!validPass) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({
            token,
            user: { id: user.id, username: user.username, email: user.email },
        });
    } catch (err) {
        console.error("Login error:", err.message);
        res.status(500).json({ error: "Login failed" });
    }
});

module.exports = router;
