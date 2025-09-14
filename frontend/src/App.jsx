import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Sentiment from './pages/Sentiment'

function App() {
  return (
    <Router>
      <nav style={{ padding: '10px', background: '#eee' }}>
        <Link to="/" style={{ marginRight: '10px' }}>Home</Link>
        <Link to="/sentiment">Sentiment Analyzer</Link>
      </nav>
      <Routes>
        <Route path="/" element={<h1>CryptoGuardian AI</h1>} />
        <Route path="/sentiment" element={<Sentiment />} />
      </Routes>
    </Router>
  )
}

export default App