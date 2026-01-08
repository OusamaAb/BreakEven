import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import History from './pages/History'
import Subscriptions from './pages/Subscriptions'
import Settings from './pages/Settings'
import Statistics from './pages/Statistics'
import Layout from './components/Layout'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    let sessionChecked = false

    // Set up auth state listener FIRST (before checking session)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      
      sessionChecked = true
      setSession(session)
      setLoading(false)
      
      // Clean up URL hash after successful sign in
      if (event === 'SIGNED_IN' && window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
      }
    })

    // If there's a hash (OAuth callback), wait for onAuthStateChange to fire
    // Otherwise, check for existing session immediately
    const hasHash = window.location.hash && (
      window.location.hash.includes('access_token') || 
      window.location.hash.includes('error')
    )

    if (hasHash) {
      // onAuthStateChange will fire when Supabase processes the hash
      // Give it a moment to process
      setTimeout(() => {
        if (!sessionChecked && mounted) {
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (!mounted || sessionChecked) return
            setSession(session)
            setLoading(false)
          })
        }
      }, 1000)
    } else {
      // No hash, check for existing session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!mounted || sessionChecked) return
        setSession(session)
        setLoading(false)
      })
    }

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-logo">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="currentColor" opacity="0.2"/>
            <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </div>
        <div className="loading-text">BreakEven</div>
        <div className="loading-spinner"></div>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
          .app-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: #050a15;
            gap: 20px;
            font-family: 'Plus Jakarta Sans', sans-serif;
          }
          .loading-logo {
            width: 64px;
            height: 64px;
            color: #10b981;
            animation: pulse 2s ease-in-out infinite;
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.8; }
          }
          .loading-text {
            font-size: 24px;
            font-weight: 700;
            color: white;
            letter-spacing: -0.5px;
          }
          .loading-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid rgba(16, 185, 129, 0.1);
            border-top-color: #10b981;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={session ? <Navigate to="/" replace /> : <Login />}
        />
        <Route
          path="/"
          element={
            session ? (
              <Layout>
                <Dashboard />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            session ? (
              <Layout>
                <Dashboard />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/history"
          element={
            session ? (
              <Layout>
                <History />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/subscriptions"
          element={
            session ? (
              <Layout>
                <Subscriptions />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/statistics"
          element={
            session ? (
              <Layout>
                <Statistics />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/settings"
          element={
            session ? (
              <Layout>
                <Settings />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="*"
          element={
            session ? (
              <Layout>
                <Navigate to="/" replace />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  )
}

export default App
