const express = require("express");
const axios = require("axios");
const NodeCache = require("node-cache");

const router = express.Router();
const cache = new NodeCache({ stdTTL: 60 });
router.get("/top", async (req, res) => {
  const cacheKey = `top_${req.query.vs_currency || "usd"}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

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

    cache.set(cacheKey, response.data);
    res.json(response.data);
  } catch (err) {
    console.error("Error fetching market data:", err.message);
    res.status(err.response?.status || 500).json({ error: "Failed to fetch market data" });
  }
});

router.get("/trending", async (req, res) => {
  const cacheKey = "trending";
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const response = await axios.get("https://api.coingecko.com/api/v3/search/trending");
    cache.set(cacheKey, response.data);
    res.json(response.data);
  } catch (err) {
    console.error("Error fetching trending coins:", err.message);
    res.status(err.response?.status || 500).json({ error: "Failed to fetch trending coins" });
  }
});

router.get("/coin/:id", async (req, res) => {
  const { id } = req.params;
  const cacheKey = `coin_${id}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/coins/${id}`,
      { params: { localization: false, sparkline: true } }
    );

    cache.set(cacheKey, response.data);
    res.json(response.data);
  } catch (err) {
    console.error("Error fetching coin details:", err.message);
    res.status(err.response?.status || 500).json({ error: "Failed to fetch coin details" });
  }
});

router.get("/coins", async (req, res) => {
  const cacheKey = "coins_list";
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/coins/markets",
      {
        params: {
          vs_currency: "usd",
          order: "market_cap_desc",
          per_page: 100,
          page: 1,
          sparkline: false,
        },
      }
    );

    const coins = response.data.map((coin) => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      image: coin.image,
      current_price: coin.current_price,
    }));

    cache.set(cacheKey, coins);
    res.json(coins);
  } catch (err) {
    console.error("Error fetching coins:", err.message);
    res.status(err.response?.status || 500).json({ error: "Failed to fetch coins" });
  }
});

module.exports = router;
