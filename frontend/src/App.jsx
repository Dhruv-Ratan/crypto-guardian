import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import Sentiment from "./pages/Sentiment";
import Dashboard from "./pages/Dashboard";
import "./styles.css";
import Home from "./pages/Home";
import Footer from "./components/Footer";
import Trending from "./pages/Trending";

function Navbar() {
  const { theme, toggleTheme } = useTheme();
  return (
    <nav className="navbar">
      <Link to="/">Home</Link>
      <Link to="/sentiment">Sentiment Analyzer</Link>
      <Link to="/dashboard">Dashboard</Link>
      <button onClick={toggleTheme} className="theme-toggle">
        {theme === "light" ? "🌙 Dark" : "☀️ Light"}
      </button>
    </nav>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/" element={<h1>CryptoGuardian AI</h1>} />
          <Route path="/sentiment" element={<Sentiment />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/trending" element={<Trending />} />
        </Routes>
        <Footer />
      </Router>
    </ThemeProvider>
  );
}

export default App;
