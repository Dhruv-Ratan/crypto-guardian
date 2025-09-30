const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const pool = require("../db")
const { body, validationResult } = require("express-validator")

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || "supersecret"
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d"

router.post(
    "/register",
    body("username").notEmpty().withMessage("Username is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    async (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }
        try {
            const { username, email, password } = req.body
            const existingUser = await pool.query(
                "SELECT * FROM users WHERE email=$1 OR username=$2",
                [email.toLowerCase(), username.trim()]
            )
            if (existingUser.rows.length > 0) {
                return res.status(400).json({ error: "User already exists" })
            }
            const salt = await bcrypt.genSalt(10)
            const hash = await bcrypt.hash(password, salt)
            const result = await pool.query(
                "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email",
                [username.trim(), email.toLowerCase(), hash]
            )
            const user = result.rows[0]
            const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
            res.status(201).json({ user, token })
        } catch (err) {
            console.error("🔥 Registration error:", err.message)
            res.status(500).json({ error: "Registration failed" })
        }
    }
)

router.post("/login", async (req, res) => {
    try {
        const { emailOrUsername, password } = req.body
        const val = emailOrUsername.trim().toLowerCase()
        const userRes = await pool.query(
            "SELECT id, username, email, password_hash FROM users WHERE LOWER(email) = $1 OR LOWER(username) = $1",
            [val]
        )
        if (!userRes.rows.length) {
            return res.status(400).json({ error: "Invalid credentials" })
        }
        const user = userRes.rows[0]
        const match = await bcrypt.compare(password, user.password_hash)
        if (!match) {
            return res.status(400).json({ error: "Invalid credentials" })
        }
        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
        res.json({ token, user: { id: user.id, username: user.username, email: user.email } })
    } catch (err) {
        console.error("🔥 Login error:", err.message)
        res.status(500).json({ error: "Login failed" })
    }
})

router.get("/me", async (req, res) => {
    try {
        const authHeader = req.headers["authorization"]
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "No token provided" })
        }
        const token = authHeader.split(" ")[1]
        const decoded = jwt.verify(token, JWT_SECRET)
        const result = await pool.query("SELECT id, username, email FROM users WHERE id = $1", [decoded.id])
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" })
        }
        res.json(result.rows[0])
    } catch (err) {
        console.error("🔥 Me error:", err.message)
        res.status(500).json({ error: "Failed to fetch user" })
    }
})

module.exports = router
