const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;

function authMiddleware(req, res, next) {
    const token = req.headers["authorization"]?.split(" ")[1];

    if (!token) return res.status(401).json({ error: "No token provided" });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ error: "Token expired, please login again" });
        }
        console.error("JWT verification failed:", err.message);
        return res.status(401).json({ error: "Invalid token" });
    }
}

module.exports = authMiddleware;
