const express = require('express')
const Sentiment = require('sentiment')   
const router = express.Router()

const sentiment = new Sentiment()

router.post('/analyze', (req, res) => {
  const { text } = req.body
  if (!text) {
    return res.status(400).json({ error: 'Text is required' })
  }

  const result = sentiment.analyze(text)

  res.json({
    score: result.score,               
    comparative: result.comparative,   
    positive: result.positive,         
    negative: result.negative          
  })
})

module.exports = router