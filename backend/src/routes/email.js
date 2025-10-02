const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

async function sendEmail(to, subject, text, html) {
    try {
        await transporter.sendMail({
            from: `"Crypto Guardian" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html,
        });
        console.log("📧 Email sent to", to);
    } catch (err) {
        console.error("❌ Email error:", err.message);
    }
}

module.exports = sendEmail;
