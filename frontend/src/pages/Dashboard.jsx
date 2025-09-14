import React, { useEffect, useState } from 'react'
import axios from 'axios'
import './Dashboard.css'

function Dashboard() {
  const [prices, setPrices] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/crypto/prices')
      .then(res => {
        setPrices(res.data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  if (loading) return <p>Loading crypto prices...</p>

  return (
    <div className="dashboard-container">
      <h2>📊 Crypto Dashboard</h2>
      <table className="crypto-table">
        <thead>
          <tr>
            <th>Coin</th>
            <th>Price (USD)</th>
            <th>24h Change (%)</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(prices).map((coin) => (
            <tr key={coin}>
              <td>{coin}</td>
              <td>${prices[coin].usd.toLocaleString()}</td>
              <td style={{ color: prices[coin].usd_24h_change >= 0 ? 'green' : 'red' }}>
                {prices[coin].usd_24h_change.toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Dashboard