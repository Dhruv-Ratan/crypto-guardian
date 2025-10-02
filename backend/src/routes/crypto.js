const express = require("express");
const fetchWithCache = require("../coingeckoClient");
const router = express.Router();

router.get("/market", async (req, res) => {
  try {
    const ids = req.query.ids || "bitcoin,ethereum,cardano";
    const vs = req.query.vs_currency || "usd";

    const data = await fetchWithCache(
      "https://api.coingecko.com/api/v3/coins/markets",
      {
        vs_currency: vs,
        ids,
        order: "market_cap_desc",
        per_page: 10,
        page: 1,
        sparkline: false,
        price_change_percentage: "24h,7d",
      }
    );

    res.json(data);
  } catch (err) {
    console.error("Error fetching market data:", err.message);
    res.status(500).json({ error: "Failed to fetch market data" });
  }
});

module.exports = router;