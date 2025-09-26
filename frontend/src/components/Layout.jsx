import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import "./Layout.css";

function Layout() {
  const location = useLocation();

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <h2 className="logo">⚡ Crypto Guardian</h2>
        <nav>
          <ul>
            <li className={location.pathname === "/dashboard" ? "active" : ""}>
              <Link to="/dashboard">📊 Dashboard</Link>
            </li>
            <li className={location.pathname === "/portfolio" ? "active" : ""}>
              <Link to="/portfolio">💼 Portfolio</Link>
            </li>
            <li className={location.pathname === "/sentiment" ? "active" : ""}>
              <Link to="/sentiment">🧠 Sentiment</Link>
            </li>
          </ul>
        </nav>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
