const express = require("express");
const fetchWithCache = require("../coingeckoClient");
const router = express.Router();

let cachedMarket = null;
let marketLastFetch = 0;
let coinCache = {};
let trendingCache = null;
let trendingLastFetch = 0;
let globalCache = null;
let globalLastFetch = 0;

const CACHE_DURATION = 30 * 1000;

function downsample(arr, points = 30) {
  if (!arr || arr.length === 0) return [];
  const step = Math.ceil(arr.length / points);
  return arr.filter((_, idx) => idx % step === 0).map((p, i) => ({
    price: p,
    idx: i,
  }));
}

router.get("/market-data", async (req, res) => {
  try {
    const now = Date.now();
    if (cachedMarket && now - marketLastFetch < 2 * 60 * 1000) {
      return res.json(filterCoins(cachedMarket, req.query.ids));
    }

    const data = await fetchWithCache("https://api.coingecko.com/api/v3/coins/markets", {
      vs_currency: "usd",
      order: "market_cap_desc",
      per_page: 50,
      page: 1,
      sparkline: true,
      price_change_percentage: "1h,24h,7d",
    });

    let processed = data.map((coin) => ({
      ...coin,
      sparkline_processed: coin.sparkline_in_7d
        ? downsample(coin.sparkline_in_7d.price)
        : null,
    }));

    cachedMarket = processed;
    marketLastFetch = now;
    res.json(filterCoins(processed, req.query.ids));
  } catch (err) {
    if (cachedMarket) return res.json(filterCoins(cachedMarket, req.query.ids));
    res.status(500).json({ error: "Failed to fetch market data" });
  }
});

router.get("/coins", async (req, res) => {
  try {
    const data = await fetchWithCache("https://api.coingecko.com/api/v3/coins/markets", {
      vs_currency: "usd",
      order: "market_cap_desc",
      per_page: 50,
      page: 1,
      sparkline: false,
    });
    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed to fetch coins list" });
  }
});

router.get("/coin/:id", async (req, res) => {
  const { id } = req.params;
  const now = Date.now();

  if (coinCache[id] && now - coinCache[id].lastFetch < 2 * 60 * 1000) {
    return res.json(coinCache[id].data);
  }

  try {
    const data = await fetchWithCache(`https://api.coingecko.com/api/v3/coins/${id}`, {
      localization: false,
      tickers: false,
      market_data: true,
      community_data: false,
      developer_data: false,
      sparkline: false,
    });

    coinCache[id] = { data, lastFetch: now };
    res.json(data);
  } catch {
    if (coinCache[id]) return res.json(coinCache[id].data);
    res.status(500).json({ error: `Failed to fetch ${id} details` });
  }
});

router.get("/coin/:id/market-chart", async (req, res) => {
  const { id } = req.params;
  const { days = 30 } = req.query;
  const cacheKey = `${id}-${days}`;
  const now = Date.now();

  if (coinCache[cacheKey] && now - coinCache[cacheKey].lastFetch < 2 * 60 * 1000) {
    return res.json(coinCache[cacheKey].data);
  }

  try {
    const data = await fetchWithCache(`https://api.coingecko.com/api/v3/coins/${id}/market_chart`, {
      vs_currency: "usd",
      days,
    });

    if (data.prices) data.prices = data.prices.filter((_, i) => i % 6 === 0);
    if (data.market_caps) data.market_caps = data.market_caps.filter((_, i) => i % 6 === 0);
    if (data.total_volumes) data.total_volumes = data.total_volumes.filter((_, i) => i % 6 === 0);

    coinCache[cacheKey] = { data, lastFetch: now };
    res.json(data);
  } catch {
    if (coinCache[cacheKey]) return res.json(coinCache[cacheKey].data);
    res.status(500).json({ error: `Failed to fetch ${id} chart` });
  }
});

router.get("/trending", async (req, res) => {
  const now = Date.now();

  if (trendingCache && now - trendingLastFetch < CACHE_DURATION) {
    return res.json(trendingCache);
  }

  try {
    const data = await fetchWithCache("https://api.coingecko.com/api/v3/search/trending");
    let coins = data.coins || [];
    if (!coins.length) coins = getFallbackTrending();

    trendingCache = { coins };
    trendingLastFetch = now;
    res.json(trendingCache);
  } catch {
    if (trendingCache) return res.json(trendingCache);
    res.json({ coins: getFallbackTrending() });
  }
});

router.get("/global", async (req, res) => {
  const now = Date.now();

  if (globalCache && now - globalLastFetch < 60 * 1000) {
    return res.json(globalCache);
  }

  try {
    const data = await fetchWithCache("https://api.coingecko.com/api/v3/global");
    globalCache = data;
    globalLastFetch = now;
    res.json(data);
  } catch {
    if (globalCache) return res.json(globalCache);
    res.status(500).json({ error: "Failed to fetch global stats" });
  }
});

function filterCoins(data, idsParam) {
  if (!idsParam) return data;
  const ids = idsParam.split(",").map((id) => id.trim().toLowerCase());
  return data.filter((coin) => ids.includes(coin.id.toLowerCase()));
}

function getFallbackTrending() {
  return [
    { item: { id: "bitcoin", name: "Bitcoin", symbol: "btc", small: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png", market_cap_rank: 1 } },
    { item: { id: "ethereum", name: "Ethereum", symbol: "eth", small: "https://assets.coingecko.com/coins/images/279/small/ethereum.png", market_cap_rank: 2 } },
    { item: { id: "solana", name: "Solana", symbol: "sol", small: "https://assets.coingecko.com/coins/images/4128/small/solana.png", market_cap_rank: 7 } },
    { item: { id: "cardano", name: "Cardano", symbol: "ada", small: "https://assets.coingecko.com/coins/images/975/small/cardano.png", market_cap_rank: 8 } },
    { item: { id: "dogecoin", name: "Dogecoin", symbol: "doge", small: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png", market_cap_rank: 9 } },
  ];
}

module.exports = router;
