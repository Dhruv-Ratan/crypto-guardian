import React, { useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import Sentiment from "./pages/Sentiment";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Footer from "./components/Footer";
import Trending from "./pages/Trending";
import CoinDetails from "./pages/CoinDetails";
import Portfolio from "./pages/Portfolio";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Alerts from "./pages/Alerts";
import Watchlist from "./pages/Watchlist";
import { WatchlistProvider } from "./context/WatchlistContext";
import "./styles.css";

function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { token, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link to="/">Home</Link>
        <Link to="/sentiment">Sentiment Analyzer</Link>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/trending">Trending</Link>
        {token && <Link to="/portfolio">Portfolio</Link>}
        {token && <Link to="/alerts">Alerts</Link>}
        {token && <Link to="/watchlist">Watchlist</Link>}
      </div>

      <div className="nav-right">
        {token ? (
          <button onClick={handleLogout} className="auth-btn">
            Logout
          </button>
        ) : (
          <>
            <Link to="/login" className="auth-link">
              Login
            </Link>
            <Link to="/register" className="auth-link">
              Register
            </Link>
          </>
        )}
        <button onClick={toggleTheme} className="theme-toggle">
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
      </div>
    </nav>
  );
}

function RequireAuth({ children }) {
  const { token } = useContext(AuthContext);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <WatchlistProvider>
          <Router>
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/sentiment" element={<Sentiment />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/trending" element={<Trending />} />
              <Route path="/coin/:id" element={<CoinDetails />} />
              <Route
                path="/portfolio"
                element={
                  <RequireAuth>
                    <Portfolio />
                  </RequireAuth>
                }
              />
              <Route
                path="/alerts"
                element={
                  <RequireAuth>
                    <Alerts />
                  </RequireAuth>
                }
              />
              <Route
                path="/watchlist"
                element={
                  <RequireAuth>
                    <Watchlist />
                  </RequireAuth>
                }
              />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
            <Footer />
          </Router>
        </WatchlistProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
