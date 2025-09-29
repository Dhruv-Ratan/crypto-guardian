const express = require("express");
const axios = require("axios");
const router = express.Router();

let cachedMarket = null;
let marketLastFetch = 0;

let coinCache = {};
let trendingCache = null;
let trendingLastFetch = 0;

const CACHE_DURATION = 30 * 1000;

router.get("/market-data", async (req, res) => {
    try {
        const now = Date.now();
        if (cachedMarket && now - marketLastFetch < 2 * 60 * 1000) {
            console.log("✅ Serving market data from cache");
            return res.json(filterCoins(cachedMarket, req.query.ids));
        }

        console.log("🌐 Fetching fresh market data...");
        const response = await axios.get(
            "https://api.coingecko.com/api/v3/coins/markets",
            {
                params: {
                    vs_currency: "usd",
                    order: "market_cap_desc",
                    per_page: 50,
                    page: 1,
                    sparkline: true,
                    price_change_percentage: "1h,24h,7d",
                },
            }
        );

        let data = response.data;
        data.forEach((coin) => {
            if (coin.sparkline_in_7d && coin.sparkline_in_7d.price) {
                coin.sparkline_in_7d.price = coin.sparkline_in_7d.price.filter(
                    (_, i) => i % 6 === 0
                );
            }
        });

        cachedMarket = data;
        marketLastFetch = now;

        res.json(filterCoins(cachedMarket, req.query.ids));
    } catch (err) {
        console.error("❌ Error fetching market data:", err.message);

        if (cachedMarket) {
            console.log("⚠️ Returning stale cached market data");
            return res.json(filterCoins(cachedMarket, req.query.ids));
        }

        res.status(500).json({ error: "Failed to fetch market data" });
    }
});

router.get("/coin/:id", async (req, res) => {
    const { id } = req.params;
    const now = Date.now();

    if (coinCache[id] && now - coinCache[id].lastFetch < 2 * 60 * 1000) {
        console.log(`✅ Serving ${id} details from cache`);
        return res.json(coinCache[id].data);
    }

    try {
        console.log(`🌐 Fetching fresh details for ${id}...`);
        const response = await axios.get(
            `https://api.coingecko.com/api/v3/coins/${id}`,
            {
                params: {
                    localization: false,
                    tickers: false,
                    market_data: true,
                    community_data: false,
                    developer_data: false,
                    sparkline: false,
                },
            }
        );

        coinCache[id] = { data: response.data, lastFetch: now };
        res.json(response.data);
    } catch (err) {
        console.error(`❌ Error fetching ${id} details:`, err.message);

        if (coinCache[id]) {
            console.log(`⚠️ Returning stale cache for ${id}`);
            return res.json(coinCache[id].data);
        }

        res.status(500).json({ error: `Failed to fetch ${id} details` });
    }
});

router.get("/coin/:id/market-chart", async (req, res) => {
    const { id } = req.params;
    const { days = 30 } = req.query;
    const cacheKey = `${id}-${days}`;
    const now = Date.now();

    if (coinCache[cacheKey] && now - coinCache[cacheKey].lastFetch < 2 * 60 * 1000) {
        console.log(`✅ Serving ${id} chart (${days}d) from cache`);
        return res.json(coinCache[cacheKey].data);
    }

    try {
        console.log(`🌐 Fetching ${id} chart (${days}d)...`);
        const response = await axios.get(
            `https://api.coingecko.com/api/v3/coins/${id}/market_chart`,
            { params: { vs_currency: "usd", days } }
        );

        let chartData = response.data;
        if (chartData.prices) {
            chartData.prices = chartData.prices.filter((_, i) => i % 6 === 0);
        }

        coinCache[cacheKey] = { data: chartData, lastFetch: now };
        res.json(chartData);
    } catch (err) {
        console.error(`❌ Error fetching ${id} chart:`, err.message);

        if (coinCache[cacheKey]) {
            console.log(`⚠️ Returning stale chart cache for ${id}`);
            return res.json(coinCache[cacheKey].data);
        }

        res.status(500).json({ error: `Failed to fetch ${id} chart` });
    }
});

router.get("/trending", async (req, res) => {
    const now = Date.now();

    if (trendingCache && now - trendingLastFetch < CACHE_DURATION) {
        console.log("✅ Serving trending coins from cache");
        return res.json(trendingCache);
    }

    try {
        console.log("🌐 Fetching fresh trending coins...");
        const response = await axios.get("https://api.coingecko.com/api/v3/search/trending");

        let coins = response.data.coins || [];
        if (!coins.length) {
            console.warn("⚠️ CoinGecko returned no trending coins → using fallback list");
            coins = getFallbackTrending();
        }

        trendingCache = { coins };
        trendingLastFetch = now;

        res.json(trendingCache);
    } catch (err) {
        console.error("❌ Error fetching trending:", err.message);

        if (trendingCache) {
            console.log("⚠️ Returning last cached trending coins");
            return res.json(trendingCache);
        }

        console.log("⚠️ Using hardcoded fallback trending list");
        res.json({ coins: getFallbackTrending() });
    }
});

function filterCoins(data, idsParam) {
    if (!idsParam) return data;
    const ids = idsParam.split(",").map((id) => id.trim().toLowerCase());
    return data.filter((coin) => ids.includes(coin.id.toLowerCase()));
}

function getFallbackTrending() {
    return [
        {
            item: {
                id: "bitcoin",
                name: "Bitcoin",
                symbol: "btc",
                small: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
                market_cap_rank: 1,
            },
        },
        {
            item: {
                id: "ethereum",
                name: "Ethereum",
                symbol: "eth",
                small: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
                market_cap_rank: 2,
            },
        },
        {
            item: {
                id: "solana",
                name: "Solana",
                symbol: "sol",
                small: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
                market_cap_rank: 7,
            },
        },
        {
            item: {
                id: "cardano",
                name: "Cardano",
                symbol: "ada",
                small: "https://assets.coingecko.com/coins/images/975/small/cardano.png",
                market_cap_rank: 8,
            },
        },
        {
            item: {
                id: "dogecoin",
                name: "Dogecoin",
                symbol: "doge",
                small: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png",
                market_cap_rank: 9,
            },
        },
    ];
}

module.exports = router;
