require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')

const app = express()
app.use(bodyParser.json())

const sentimentRoutes = require('./routes/sentiment')
const cryptoRoutes = require('./routes/crypto')

app.get('/api/hello', (req, res) => {
  res.json({ msg: 'Backend is alive!' })
})

app.use('/api/sentiment', sentimentRoutes)
app.use('/api/crypto', cryptoRoutes)

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`))