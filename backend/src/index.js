require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')

const app = express()
app.use(bodyParser.json())

// Import routes
const sentimentRoutes = require('./routes/sentiment')

// Test route
app.get('/api/hello', (req, res) => {
  res.json({ msg: 'Backend is alive!' })
})

// Sentiment route
app.use('/api/sentiment', sentimentRoutes)

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`))
