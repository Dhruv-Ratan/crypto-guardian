const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"];
        if (!authHeader) {
            console.error("❌ No Authorization header");
            return res.status(401).json({ error: "No token provided" });
        }
        if (!authHeader.startsWith("Bearer ")) {
            console.error("❌ Invalid header format:", authHeader);
            return res.status(401).json({ error: "Invalid token format" });
        }
        const token = authHeader.split(" ")[1];
        if (!token) {
            console.error("❌ Token missing after Bearer");
            return res.status(401).json({ error: "Missing token" });
        }
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                if (err.name === "TokenExpiredError") {
                    console.error("❌ Token expired at", err.expiredAt);
                    return res.status(401).json({ error: "Token expired" });
                } else if (err.name === "JsonWebTokenError") {
                    console.error("❌ Invalid token:", err.message);
                    return res.status(401).json({ error: "Invalid token" });
                } else {
                    console.error("❌ JWT error:", err.message);
                    return res.status(401).json({ error: "Token verification failed" });
                }
            }
            req.userId = decoded.id || decoded.user_id;
            if (!req.userId) {
                console.error("❌ Token decoded but no userId:", decoded);
                return res.status(401).json({ error: "Invalid token payload" });
            }
            next();
        });
    } catch (err) {
        console.error("❌ Unexpected auth error:", err.message);
        return res.status(500).json({ error: "Auth middleware failed" });
    }
};
