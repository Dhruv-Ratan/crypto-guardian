import React from "react";
import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
  return (
    <div className="home-container">
      <header className="hero">
        <div className="hero-logo">🛡️</div>
        <h1 className="hero-title">CryptoGuardian AI</h1>
        <p className="hero-tagline">
          Your AI-powered companion for <span>crypto insights</span>,{" "}
          <span>market trends</span>, and <span>wallet tracking</span>.
        </p>
        <div className="hero-buttons">
          <Link to="/dashboard" className="btn-primary">
            📊 Go to Dashboard
          </Link>
          <Link to="/sentiment" className="btn-secondary">
            🧠 Try Sentiment Analyzer
          </Link>
        </div>
      </header>

      <section className="features">
        <div className="card">
          <h3>🔎 Sentiment Analysis</h3>
          <p>
            Analyze crypto news, tweets, and discussions instantly using
            AI-powered sentiment analysis.
          </p>
        </div>
        <div className="card">
          <h3>📈 Live Dashboard</h3>
          <p>
            Track real-time prices, percentage changes, and market trends of top
            cryptocurrencies.
          </p>
        </div>
        <div className="card">
          <h3>💼 Wallet Tracker</h3>
          <p>
            Monitor your portfolio, transactions, and wallet balances securely
            in one place.
          </p>
        </div>
      </section>
    </div>
  );
}

export default Home;
