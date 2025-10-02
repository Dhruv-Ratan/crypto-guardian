const axios = require("axios");
const NodeCache = require("node-cache");

const cache = new NodeCache({ stdTTL: 60 });

async function fetchWithCache(url, params = {}) {
    const key = `${url}?${JSON.stringify(params)}`;
    const cached = cache.get(key);
    if (cached) return cached;

    let retries = 3;
    let delay = 2000;

    while (retries > 0) {
        try {
            const res = await axios.get(url, { params, timeout: 8000 });
            cache.set(key, res.data);
            return res.data;
        } catch (err) {
            if (err.response && err.response.status === 429) {
                await new Promise(r => setTimeout(r, delay));
                delay *= 2;
                retries--;
            } else if (err.code === "ECONNRESET") {
                await new Promise(r => setTimeout(r, delay));
                retries--;
            } else {
                throw err;
            }
        }
    }

    throw new Error("Failed after retries");
}

module.exports = fetchWithCache;
