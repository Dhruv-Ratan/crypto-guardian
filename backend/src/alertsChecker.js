const cron = require("node-cron");
const axios = require("axios");
const pool = require("./db");

cron.schedule("*/5 * * * *", async () => {
    try {
        console.log("🔍 Checking price alerts...");
        const alerts = await pool.query(
            `SELECT * FROM alerts WHERE triggered = false`
        );

        for (let alert of alerts.rows) {
            const { id, user_id, coin_id, target_price, direction } = alert;
            const res = await axios.get(
                `https://api.coingecko.com/api/v3/simple/price?ids=${coin_id}&vs_currencies=usd`
            );
            const currentPrice = res.data[coin_id]?.usd;

            if (!currentPrice) continue;

            let shouldTrigger = false;
            if (direction === "above" && currentPrice >= target_price) {
                shouldTrigger = true;
            }
            if (direction === "below" && currentPrice <= target_price) {
                shouldTrigger = true;
            }

            if (shouldTrigger) {
                await pool.query(`UPDATE alerts SET triggered = true WHERE id = $1`, [
                    id,
                ]);
                console.log(
                    `⚡ Alert triggered for ${coin_id} (User ${user_id}): Current $${currentPrice} crossed ${direction} $${target_price}`
                );
            }
        }
    } catch (err) {
        console.error("❌ Error checking alerts:", err.message);
    }
});
