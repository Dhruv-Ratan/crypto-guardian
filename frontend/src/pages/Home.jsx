import React from 'react'
import { Link } from 'react-router-dom'
import './Home.css'

function Home() {
  return (
    <div className="home-hero">
      <h1>🛡️ CryptoGuardian AI</h1>
      <p>Your AI-powered companion for crypto insights, market trends, and wallet tracking.</p>

      <div className="home-actions">
        <Link to="/dashboard" className="home-button">📊 Go to Dashboard</Link>
        <Link to="/sentiment" className="home-button">🔎 Try Sentiment Analyzer</Link>
      </div>
    </div>
  )
}

export default Home