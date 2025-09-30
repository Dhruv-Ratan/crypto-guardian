require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const pool = require("./db")
const authMiddleware = require("./middleware/authMiddleware")

const app = express()
app.use(bodyParser.json())
app.use(cors())
app.use(express.json())

const sentimentRoutes = require('./routes/sentiment')
const cryptoRoutes = require('./routes/crypto')
const coingeckoRoutes = require('./routes/coingecko')
const portfolioRoutes = require("./routes/portfolio")
const authRoutes = require("./routes/auth")
const alertsRouter = require("./routes/alerts")
const watchlistRouter = require("./routes/watchlist")
const marketRoutes = require("./routes/market")

app.use('/api/sentiment', sentimentRoutes)
app.use('/api/crypto', cryptoRoutes)
app.use('/api/coingecko', coingeckoRoutes)
app.use("/api/portfolio", portfolioRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/alerts", alertsRouter)
app.use("/api/watchlist", watchlistRouter)
app.use("/api", marketRoutes)

app.get('/api/hello', (req, res) => {
  res.json({ msg: 'Backend is alive!' })
})

app.get("/api/test-auth", authMiddleware, (req, res) => {
  res.json({ msg: "Auth works ✅", userId: req.userId })
})

require("./alertsChecker")

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`⚡ Backend running on http://localhost:${PORT}`)
})
