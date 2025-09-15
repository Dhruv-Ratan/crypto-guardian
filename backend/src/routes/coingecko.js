const express = require('express')
const axios = require('axios')
const router = express.Router()

const BASE = process.env.COINGECKO_BASE_URL || 'https://pro-api.coingecko.com/api/v3'
const API_KEY = process.env.COINGECKO_API_KEY || ''

router.get('/top', async (req, res) => {
  try {
    const ids = req.query.ids || 'bitcoin,ethereum,cardano'
    const vs = req.query.vs_currency || 'usd'

    const headers = {}
    if (API_KEY) {
      headers['CG-TSmE4QFcZjdUFUXQYyyxYmza'] = API_KEY
    }

    const response = await axios.get(`${BASE}/simple/price`, {
      params: { ids, vs_currencies: vs, include_24hr_change: 'true' },
      headers
    })

    res.json(response.data)
  } catch (err) {
    console.error(
      'coingecko/top error',
      err?.response?.status,
      err?.response?.data || err.message
    )
    res.status(500).json({ error: 'Failed to fetch top prices' })
  }
})

module.exports = router