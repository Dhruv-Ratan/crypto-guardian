import React, { useEffect, useState } from 'react'
import axios from 'axios'

function App() {
  const [msg, setMsg] = useState('Loading...')

  useEffect(() => {
    axios.get('/api/hello')
      .then(r => setMsg(r.data.msg))
      .catch(err => {
        console.error('Error connecting to backend:', err)
        setMsg('Backend not reachable')
      })
  }, [])

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', textAlign: 'center', marginTop: '50px' }}>
      <h1>CryptoGuardian AI</h1>
      <p>{msg}</p>
    </div>
  )
}

export default App
