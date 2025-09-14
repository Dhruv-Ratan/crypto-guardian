const express = require('express')
const Sentiment = require('sentiment')

const router = express.Router()
const sentiment = new Sentiment()

// POST /api/sentiment/analyze
router.post('/analyze', (req, res) => {
  const { text } = req.body
  if (!text) {
    return res.status(400).json({ error: 'Text is required' })
  }
  const result = sentiment.analyze(text)
  res.json(result)
})

module.exports = router
