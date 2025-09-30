const cron = require("node-cron");
const axios = require("axios");
const pool = require("./db");

cron.schedule("*/5 * * * *", async () => {
    try {
        console.log("🔍 Checking price alerts...");
        const alertsRes = await pool.query(
            `SELECT * FROM alerts WHERE triggered = false`
        );
        const alerts = alertsRes.rows;

        if (alerts.length === 0) {
            console.log("✅ No active alerts to check.");
            return;
        }
        const uniqueCoins = [...new Set(alerts.map((a) => a.coin_id))];
        const res = await axios.get(
            "https://api.coingecko.com/api/v3/simple/price",
            {
                params: {
                    ids: uniqueCoins.join(","),
                    vs_currencies: "usd",
                },
            }
        );

        const prices = res.data;
        for (let alert of alerts) {
            const { id, user_id, coin_id, target_price, direction } = alert;
            const currentPrice = prices[coin_id]?.usd;

            if (!currentPrice) continue;

            let shouldTrigger = false;
            if (direction === "above" && currentPrice >= target_price) {
                shouldTrigger = true;
            }
            if (direction === "below" && currentPrice <= target_price) {
                shouldTrigger = true;
            }

            if (shouldTrigger) {
                await pool.query(
                    `UPDATE alerts 
           SET triggered = true, triggered_at = NOW() 
           WHERE id = $1`,
                    [id]
                );

                console.log(
                    `⚡ Alert triggered for ${coin_id} (User ${user_id}): Current $${currentPrice} crossed ${direction} $${target_price}`
                );
            }
        }
    } catch (err) {
        console.error("❌ Error checking alerts:", err.message);
    }
});
