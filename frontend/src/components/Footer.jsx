import React from 'react'
import './Footer.css'

function Footer() {
  return (
    <footer className="footer">
      <p>© {new Date().getFullYear()} CryptoGuardian AI. All rights reserved.</p>
      {/* <p>
        <a href="https://github.com/Dhruv-Ratan/crypto-guardian" target="_blank" rel="noopener noreferrer">
          🔗 View on GitHub
        </a>
      </p> */}
    </footer>
  )
}

export default Footer