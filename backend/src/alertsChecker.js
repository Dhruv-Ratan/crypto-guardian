const cron = require("node-cron");
const axios = require("axios");
const pool = require("./db");
const sendEmail = require("./routes/email");

cron.schedule("*/5 * * * *", async () => {
    try {
        console.log("🔍 Checking price alerts...");
        const alertsRes = await pool.query(
            `SELECT a.*, u.email, u.username
       FROM alerts a
       JOIN users u ON u.id = a.user_id
       WHERE a.triggered = false`
        );

        const alerts = alertsRes.rows;
        if (alerts.length === 0) {
            console.log("✅ No active alerts to check.");
            return;
        }

        const uniqueCoins = [...new Set(alerts.map((a) => a.coin_id))];
        const res = await axios.get("https://api.coingecko.com/api/v3/simple/price", {
            params: {
                ids: uniqueCoins.join(","),
                vs_currencies: "usd",
            },
        });

        const prices = res.data;

        for (let alert of alerts) {
            const { id, user_id, coin_id, target_price, direction, email, username } = alert;
            const currentPrice = prices[coin_id]?.usd;

            if (!currentPrice) continue;

            let shouldTrigger = false;
            if (direction === "above" && currentPrice >= target_price) shouldTrigger = true;
            if (direction === "below" && currentPrice <= target_price) shouldTrigger = true;

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

                const subject = `🚨 Crypto Alert: ${coin_id.toUpperCase()} hit your target!`;
                const plainMessage = `
Hello ${username || "Trader"},

Your price alert for ${coin_id} was just triggered!

- Direction: ${direction.toUpperCase()}
- Target Price: $${target_price}
- Current Price: $${currentPrice}

Log in to Crypto Guardian to manage your alerts.

Stay sharp 🚀,
Crypto Guardian Team
        `;

                const htmlMessage = `
<div style="font-family: Arial, sans-serif; background:#f5f7fa; padding:20px;">
  <div style="max-width:600px; margin:auto; background:#fff; border-radius:10px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.1);">
    <div style="background:#111827; color:#fff; padding:15px 20px; text-align:center; font-size:20px; font-weight:bold;">
      🚨 Crypto Guardian Alert
    </div>
    <div style="padding:20px; color:#333;">
      <p>Hello <strong>${username || "Trader"}</strong>,</p>
      <p>Your price alert for <strong style="color:#007bff;">${coin_id.toUpperCase()}</strong> was just triggered!</p>
      <table style="width:100%; border-collapse:collapse; margin:20px 0;">
        <tr>
          <td style="padding:10px; border:1px solid #ddd;">Direction</td>
          <td style="padding:10px; border:1px solid #ddd; font-weight:bold;">${direction.toUpperCase()}</td>
        </tr>
        <tr>
          <td style="padding:10px; border:1px solid #ddd;">Target Price</td>
          <td style="padding:10px; border:1px solid #ddd;">$${target_price}</td>
        </tr>
        <tr>
          <td style="padding:10px; border:1px solid #ddd;">Current Price</td>
          <td style="padding:10px; border:1px solid #ddd; color:${direction === "above" ? "green" : "red"
                    }; font-weight:bold;">
            $${currentPrice}
          </td>
        </tr>
      </table>
      <p>
        <a href="https://your-frontend-url.com/alerts"
           style="display:inline-block; padding:10px 20px; background:#2563eb; color:#fff; text-decoration:none; border-radius:6px; font-weight:bold;">
          View My Alerts
        </a>
      </p>
      <p style="margin-top:20px; font-size:12px; color:#666;">
        Stay sharp 🚀,<br/>Crypto Guardian Team
      </p>
    </div>
  </div>
</div>
`;

                await sendEmail(email, subject, plainMessage, htmlMessage);
            }
        }
    } catch (err) {
        console.error("❌ Error checking alerts:", err.message);
    }
});
