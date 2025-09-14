import React, { useState } from 'react'
import axios from 'axios'
import './Sentiment.css'   

function Sentiment() {
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)

  const analyzeSentiment = async () => {
    try {
      const res = await axios.post('/api/sentiment/analyze', { text })
      setResult(res.data)
    } catch (err) {
      console.error(err)
      alert('Error analyzing sentiment')
    }
  }

  const getSentimentLabel = (score) => {
    if (score > 0) {
      return <span className="sentiment-badge sentiment-positive">😊 Positive</span>
    }
    if (score < 0) {
      return <span className="sentiment-badge sentiment-negative">☹️ Negative</span>
    }
    return <span className="sentiment-badge sentiment-neutral">😐 Neutral</span>
  }

  return (
    <div className="sentiment-container">
      <div className="sentiment-card">
        <h2>🔎 Sentiment Analyzer</h2>

        <textarea
          className="sentiment-textarea"
          rows="4"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type something to analyze..."
        />

        <br />
        <button className="sentiment-button" onClick={analyzeSentiment}>
          Analyze
        </button>

        {result && (
          <div className="sentiment-result">
            <h3>Result</h3>
            <p><strong>Sentiment:</strong> {getSentimentLabel(result.score)}</p>
            <p><strong>Score:</strong> {result.score}</p>
            <p><strong>Comparative:</strong> {result.comparative.toFixed(2)}</p>

            {result.positive.length > 0 && (
              <p className="positive"><strong>Positive words:</strong> {result.positive.join(', ')}</p>
            )}

            {result.negative.length > 0 && (
              <p className="negative"><strong>Negative words:</strong> {result.negative.join(', ')}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Sentiment
