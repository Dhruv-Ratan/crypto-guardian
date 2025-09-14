const express = require('express')
const axios = require('axios')
const router = express.Router()

router.get('/prices', async (req, res) => {
  try {
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price',
      {
        params: {
          ids: 'bitcoin,ethereum,cardano',
          vs_currencies: 'usd',
          include_24hr_change: 'true'
        }
      }
    )

    res.json(response.data)
  } catch (err) {
    console.error('Error fetching crypto prices:', err.message)
    res.status(500).json({ error: 'Failed to fetch prices' })
  }
})

module.exports = router