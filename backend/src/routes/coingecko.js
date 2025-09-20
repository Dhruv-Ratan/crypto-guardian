const express = require("express");
const axios = require("axios");
const router = express.Router();

router.get("/top", async (req, res) => {
  try {
    const vs_currency = req.query.vs_currency || "usd";

    const response = await axios.get(
      "https://api.coingecko.com/api/v3/coins/markets",
      {
        params: {
          vs_currency,
          order: "market_cap_desc",
          per_page: 10,
          page: 1,
          sparkline: true,
          price_change_percentage: "24h,7d",
        },
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error("Error fetching market data:", err.message);
    res.status(500).json({ error: "Failed to fetch market data" });
  }
});

router.get("/trending", async (req, res) => {
  try {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/search/trending"
    );
    res.json(response.data);
  } catch (err) {
    console.error("Error fetching trending coins:", err.message);
    res.status(500).json({ error: "Failed to fetch trending coins" });
  }
});

router.get("/coin/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/coins/${id}`,
      {
        params: { localization: false, sparkline: true },
      }
    );
    res.json(response.data);
  } catch (err) {
    console.error("Error fetching coin details:", err.message);
    res.status(500).json({ error: "Failed to fetch coin details" });
  }
});

router.get("/price", async (req, res) => {
  try {
    const { ids, vs_currency } = req.query;
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price",
      {
        params: {
          ids,
          vs_currencies: vs_currency || "usd",
        },
      }
    );
    res.json(response.data);
  } catch (err) {
    console.error("Error fetching prices:", err.message);
    res.status(500).json({ error: "Failed to fetch prices" });
  }
});

module.exports = router;