import React, { useState } from "react";
import axios from "axios";
import "./Sentiment.css";
import { toast } from "react-toastify";

function Sentiment() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const base = import.meta.env.VITE_API_BASE || "http://localhost:4000";

  const analyzeSentiment = async () => {
    if (!text.trim()) {
      toast.warn("⚠️ Please enter some text!");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await axios.post(`${base}/api/sentiment/analyze`, { text });
      setResult(res.data);
      toast.success("✅ Sentiment analyzed!");
    } catch (err) {
      console.error("Error analyzing sentiment:", err);
      toast.error("❌ Failed to analyze sentiment. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const getSentimentLabel = (score) => {
    if (score > 0)
      return <span className="sentiment-positive">😊 Positive</span>;
    if (score < 0)
      return <span className="sentiment-negative">☹️ Negative</span>;
    return <span className="sentiment-neutral">😐 Neutral</span>;
  };

  const highlightText = (text) => {
    if (!result) return text;

    return text.split(/\s+/).map((word, idx) => {
      const clean = word.toLowerCase().replace(/[^a-z]/gi, "");
      if (result.positive?.includes(clean)) {
        return (
          <span key={idx} className="highlight positive">
            {word}{" "}
          </span>
        );
      }
      if (result.negative?.includes(clean)) {
        return (
          <span key={idx} className="highlight negative">
            {word}{" "}
          </span>
        );
      }
      return word + " ";
    });
  };

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

        <button
          className="sentiment-button"
          onClick={analyzeSentiment}
          disabled={loading}
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>

        {loading && <div className="spinner"></div>}

        {result && (
          <div className="sentiment-result">
            <h3>Result</h3>
            <p>
              <strong>Sentiment:</strong> {getSentimentLabel(result.score)}
            </p>
            <p>
              <strong>Score:</strong> {Number(result.score).toFixed(3)}
            </p>
            <p>
              <strong>Comparative:</strong>{" "}
              {Number(result.comparative).toFixed(3)}
            </p>

            <div className="highlighted-text">
              <h4>Analyzed Text</h4>
              <p>{highlightText(text)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Sentiment;
