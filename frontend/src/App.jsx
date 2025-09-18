import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import Sentiment from "./pages/Sentiment";
import Dashboard from "./pages/Dashboard";
import "./styles.css";
import Home from "./pages/Home";
import Footer from "./components/Footer";
import Trending from "./pages/Trending";
import CoinDetails from "./pages/CoinDetails";

function Navbar() {
  const { theme, toggleTheme } = useTheme();
  return (
    <nav className="navbar">
      <Link to="/">Home</Link>
      <Link to="/sentiment">Sentiment Analyzer</Link>
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/trending">Trending</Link> {/* 👈 added link */}
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
          <Route path="/sentiment" element={<Sentiment />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/trending" element={<Trending />} />
          <Route path="/coin/:id" element={<CoinDetails />} />
        </Routes>
        <Footer />
      </Router>
    </ThemeProvider>
  );
}

export default App;
