import React, { useState } from 'react'
import axios from 'axios'
import './Sentiment.css'

function Sentiment() {
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const analyzeSentiment = async () => {
    if (!text.trim()) {
      alert('Please enter some text!')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const res = await axios.post('/api/sentiment/analyze', { text })
      setResult(res.data)
    } catch (err) {
      console.error(err)
      alert('Error analyzing sentiment')
    } finally {
      setLoading(false)
    }
  }

  const getSentimentLabel = (score) => {
    if (score > 0) return <span className="sentiment-positive">😊 Positive</span>
    if (score < 0) return <span className="sentiment-negative">☹️ Negative</span>
    return <span className="sentiment-neutral">😐 Neutral</span>
  }

  const highlightText = (text) => {
    if (!result) return text

    return text.split(/\s+/).map((word, idx) => {
      const clean = word.toLowerCase().replace(/[^a-z]/gi, '') 
      if (result.positive.includes(clean)) {
        return <span key={idx} className="positive">{word} </span>
      }
      if (result.negative.includes(clean)) {
        return <span key={idx} className="negative">{word} </span>
      }
      return word + ' '
    })
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
        <button
          className="sentiment-button"
          onClick={analyzeSentiment}
          disabled={loading}
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>

        {loading && <div className="spinner"></div>}

        {result && (
          <div className="sentiment-result">
            <h3>Result</h3>
            <p><strong>Sentiment:</strong> {getSentimentLabel(result.score)}</p>
            <p><strong>Score:</strong> {result.score}</p>
            <p><strong>Comparative:</strong> {result.comparative.toFixed(2)}</p>

            <div className="highlighted-text">
              <strong>Analyzed Text:</strong>
              <p>{highlightText(text)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Sentiment