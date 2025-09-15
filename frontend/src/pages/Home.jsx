import React from 'react'
import { Link } from 'react-router-dom'
import './Home.css'

function Home() {
  return (
    <div className="home-container">
      <section className="home-hero">
        <h1>🛡️ CryptoGuardian AI</h1>
        <p>
          Your AI-powered companion for <strong>crypto insights</strong>, 
          <strong> market trends</strong>, and <strong>wallet tracking</strong>.
        </p>
        <div className="home-actions">
          <Link to="/dashboard" className="home-button">📊 Go to Dashboard</Link>
          <Link to="/sentiment" className="home-button">🔎 Try Sentiment Analyzer</Link>
        </div>
      </section>

      <section className="home-features">
        <div className="card">
          <h3>🔎 Sentiment Analysis</h3>
          <p>Analyze crypto news, tweets, and discussions instantly using AI-powered sentiment scoring.</p>
        </div>
        <div className="card">
          <h3>📊 Live Dashboard</h3>
          <p>Track real-time prices, percentage changes, and trends of the top cryptocurrencies.</p>
        </div>
        <div className="card">
          <h3>💰 Wallet Tracker</h3>
          <p>Monitor your portfolio, transactions, and wallet balances securely in one place.</p>
        </div>
      </section>
    </div>
  )
}

export default Home
