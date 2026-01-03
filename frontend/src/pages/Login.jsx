import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleGoogleLogin = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    setLoading(true)
    setError(null)
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      })

      if (error) {
        setError(error.message)
        setLoading(false)
      }
    } catch (err) {
      setError(err.message || 'Failed to sign in')
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      {/* Decorative background */}
      <div className="login-bg">
        <div className="login-bg-shape login-bg-shape-1"></div>
        <div className="login-bg-shape login-bg-shape-2"></div>
        <div className="login-bg-shape login-bg-shape-3"></div>
        <div className="login-grid"></div>
      </div>

      {/* Floating particles */}
      <div className="particles">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="particle" style={{
            '--delay': `${Math.random() * 5}s`,
            '--duration': `${15 + Math.random() * 20}s`,
            '--x-start': `${Math.random() * 100}%`,
            '--x-end': `${Math.random() * 100}%`,
            '--size': `${2 + Math.random() * 4}px`,
          }}></div>
        ))}
      </div>

      <div className="login-container">
        {/* Left side - Branding */}
        <div className="login-hero">
          <div className="login-hero-content">
            <div className="login-logo">
              <div className="login-logo-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="currentColor" opacity="0.2"/>
                  <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <span className="login-logo-text">BreakEven</span>
            </div>
            
            <h1 className="login-hero-title">
              Take control of your <span className="text-gradient">daily spending</span>
            </h1>
            
            <p className="login-hero-subtitle">
              Set a daily allowance, track expenses, and watch your savings grow with intelligent carryover budgeting.
            </p>

            <div className="login-features">
              <div className="login-feature" style={{'--delay': '0.1s'}}>
                <div className="login-feature-icon">📊</div>
                <div className="login-feature-text">
                  <strong>Daily Allowance</strong>
                  <span>Set your spending limit</span>
                </div>
              </div>
              <div className="login-feature" style={{'--delay': '0.2s'}}>
                <div className="login-feature-icon">💰</div>
                <div className="login-feature-text">
                  <strong>Smart Carryover</strong>
                  <span>Unspent money rolls forward</span>
                </div>
              </div>
              <div className="login-feature" style={{'--delay': '0.3s'}}>
                <div className="login-feature-icon">📈</div>
                <div className="login-feature-text">
                  <strong>Track Progress</strong>
                  <span>Visualize your habits</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="login-form-section">
          <div className="login-form-container">
            <div className="login-form-glow"></div>
            
            <div className="login-form-header">
              <h2>Welcome back</h2>
              <p>Sign in to continue to your dashboard</p>
            </div>

            {error && (
              <div className="login-error">
                <svg viewBox="0 0 20 20" fill="currentColor" className="login-error-icon">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="login-google-btn"
            >
              <div className="btn-bg"></div>
              <div className="btn-content">
                {loading ? (
                  <div className="login-spinner"></div>
                ) : (
                  <svg className="login-google-icon" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                <span>{loading ? 'Signing in...' : 'Continue with Google'}</span>
              </div>
            </button>

            <div className="login-divider">
              <span>Secure authentication</span>
            </div>

            <div className="login-providers">
              <div className="login-provider">
                <svg viewBox="0 0 109 113" fill="currentColor">
                  <path d="M63.708 110.284C69.417 110.284 74.2 107.453 77.566 102.932L63.107 93.5V66.8L90.076 82.058C90.4 83.6 90.576 85.2 90.576 86.8C90.576 100.675 79.08 111.9 65.208 111.9C63.308 111.9 61.458 111.7 59.658 111.35L63.708 110.284ZM38.608 101.333C42.08 106.667 47.508 110.284 53.708 110.284L58.008 111.4C56.158 111.75 54.258 111.9 52.308 111.9C38.433 111.9 26.933 100.675 26.933 86.8C26.933 85.2 27.108 83.6 27.433 82.058L54.408 66.8V93.5L38.608 101.333ZM24.508 78.342C21.508 73.517 19.783 67.85 19.783 61.8C19.783 55.75 21.508 50.083 24.508 45.258L38.517 54.4V73.2L24.508 78.342ZM27.433 41.542C27.108 40 26.933 38.4 26.933 36.8C26.933 22.925 38.433 11.7 52.308 11.7C54.258 11.7 56.158 11.9 58.008 12.25L53.708 13.316C47.508 13.316 42.08 16.933 38.608 22.267L54.408 30.1V56.8L27.433 41.542ZM63.107 30.1V56.8L90.076 41.542C90.4 40 90.576 38.4 90.576 36.8C90.576 22.925 79.08 11.7 65.208 11.7C63.308 11.7 61.458 11.9 59.658 12.25L63.708 13.316C69.417 13.316 74.2 16.147 77.566 20.667L63.107 30.1ZM93.008 45.258C96.008 50.083 97.733 55.75 97.733 61.8C97.733 67.85 96.008 73.517 93.008 78.342L79.008 69.2V50.4L93.008 45.258Z"/>
                </svg>
                <span>Supabase</span>
              </div>
              <div className="login-provider-divider">+</div>
              <div className="login-provider">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                </svg>
                <span>Google</span>
              </div>
            </div>

            <p className="login-footer">
              By signing in, you agree to our Terms & Privacy Policy
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .login-page {
          min-height: 100vh;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #050a15;
          position: relative;
          overflow: hidden;
        }

        .login-bg {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .login-grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(16, 185, 129, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16, 185, 129, 0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
        }

        .login-bg-shape {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
        }

        .login-bg-shape-1 {
          width: 800px;
          height: 800px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, transparent 70%);
          top: -300px;
          left: -300px;
          animation: morph 25s ease-in-out infinite;
        }

        .login-bg-shape-2 {
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%);
          bottom: -200px;
          right: -200px;
          animation: morph 20s ease-in-out infinite reverse;
        }

        .login-bg-shape-3 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%);
          top: 40%;
          left: 40%;
          animation: float 15s ease-in-out infinite;
        }

        @keyframes morph {
          0%, 100% { 
            transform: scale(1) rotate(0deg);
            border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
          }
          25% { 
            transform: scale(1.1) rotate(90deg);
            border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
          }
          50% { 
            transform: scale(0.9) rotate(180deg);
            border-radius: 50% 60% 30% 60% / 30% 60% 70% 40%;
          }
          75% { 
            transform: scale(1.05) rotate(270deg);
            border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
          }
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(50px, -50px) scale(1.1); }
          50% { transform: translate(0, -100px) scale(1); }
          75% { transform: translate(-50px, -50px) scale(0.9); }
        }

        /* Floating particles */
        .particles {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .particle {
          position: absolute;
          width: var(--size);
          height: var(--size);
          background: linear-gradient(135deg, #10b981, #3b82f6);
          border-radius: 50%;
          bottom: -20px;
          left: var(--x-start);
          opacity: 0.6;
          animation: rise var(--duration) var(--delay) infinite linear;
        }

        @keyframes rise {
          0% {
            transform: translateY(0) translateX(0) scale(0);
            opacity: 0;
          }
          10% {
            opacity: 0.6;
            transform: scale(1);
          }
          90% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(-100vh) translateX(calc(var(--x-end) - var(--x-start))) scale(0.5);
            opacity: 0;
          }
        }

        .login-container {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 100vh;
        }

        @media (max-width: 1024px) {
          .login-container {
            grid-template-columns: 1fr;
          }
          .login-hero {
            display: none;
          }
        }

        .login-hero {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 60px;
          animation: fadeInLeft 0.8s ease-out;
        }

        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .login-hero-content {
          max-width: 500px;
        }

        .login-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 48px;
          animation: fadeInDown 0.6s ease-out;
        }

        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .login-logo-icon {
          width: 48px;
          height: 48px;
          color: #10b981;
          animation: pulse-glow 2s ease-in-out infinite;
        }

        @keyframes pulse-glow {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.4)); }
          50% { filter: drop-shadow(0 0 20px rgba(16, 185, 129, 0.8)); }
        }

        .login-logo-text {
          font-size: 24px;
          font-weight: 700;
          color: white;
          letter-spacing: -0.5px;
        }

        .login-hero-title {
          font-size: 52px;
          font-weight: 800;
          color: white;
          line-height: 1.1;
          margin-bottom: 24px;
          letter-spacing: -2px;
          animation: fadeInUp 0.8s ease-out 0.2s both;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .text-gradient {
          background: linear-gradient(135deg, #10b981 0%, #3b82f6 50%, #8b5cf6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          background-size: 200% 200%;
          animation: gradient-shift 5s ease infinite;
        }

        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .login-hero-subtitle {
          font-size: 18px;
          color: #64748b;
          line-height: 1.7;
          margin-bottom: 48px;
          animation: fadeInUp 0.8s ease-out 0.4s both;
        }

        .login-features {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .login-feature {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px 22px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(10px);
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          animation: fadeInUp 0.6s ease-out calc(var(--delay) + 0.5s) both;
          position: relative;
          overflow: hidden;
        }

        .login-feature::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(59, 130, 246, 0.1));
          opacity: 0;
          transition: opacity 0.3s;
        }

        .login-feature:hover::before {
          opacity: 1;
        }

        .login-feature:hover {
          transform: translateX(12px) scale(1.02);
          border-color: rgba(16, 185, 129, 0.3);
          box-shadow: 
            0 0 30px rgba(16, 185, 129, 0.1),
            0 10px 40px rgba(0, 0, 0, 0.2);
        }

        .login-feature-icon {
          font-size: 28px;
          position: relative;
          z-index: 1;
          transition: transform 0.3s;
        }

        .login-feature:hover .login-feature-icon {
          transform: scale(1.2) rotate(-10deg);
        }

        .login-feature-text {
          display: flex;
          flex-direction: column;
          flex: 1;
          position: relative;
          z-index: 1;
        }

        .login-feature-text strong {
          color: white;
          font-weight: 600;
          font-size: 15px;
          transition: color 0.3s;
        }

        .login-feature:hover .login-feature-text strong {
          color: #10b981;
        }

        .login-feature-text span {
          color: #64748b;
          font-size: 13px;
        }

        .login-form-section {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          animation: fadeInRight 0.8s ease-out;
        }

        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .login-form-container {
          width: 100%;
          max-width: 420px;
          padding: 48px;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.8));
          border-radius: 28px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(40px);
          position: relative;
          overflow: hidden;
          box-shadow: 
            0 0 0 1px rgba(255, 255, 255, 0.05),
            0 25px 50px -12px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .login-form-glow {
          position: absolute;
          top: -100px;
          right: -100px;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%);
          pointer-events: none;
          animation: glow-pulse 4s ease-in-out infinite;
        }

        @keyframes glow-pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }

        .login-form-header {
          text-align: center;
          margin-bottom: 36px;
          position: relative;
          z-index: 1;
        }

        .login-form-header h2 {
          font-size: 32px;
          font-weight: 700;
          color: white;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }

        .login-form-header p {
          color: #64748b;
          font-size: 15px;
        }

        .login-error {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 16px;
          background: rgba(220, 38, 38, 0.1);
          border: 1px solid rgba(220, 38, 38, 0.2);
          border-radius: 12px;
          color: #f87171;
          font-size: 14px;
          margin-bottom: 24px;
          animation: shake 0.5s ease-out;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }

        .login-error-icon {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        .login-google-btn {
          width: 100%;
          position: relative;
          padding: 0;
          background: transparent;
          border: none;
          border-radius: 14px;
          cursor: pointer;
          font-family: inherit;
          overflow: hidden;
          transition: transform 0.3s, box-shadow 0.3s;
        }

        .login-google-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 20px 40px rgba(16, 185, 129, 0.2);
        }

        .login-google-btn:active:not(:disabled) {
          transform: translateY(0) scale(0.98);
        }

        .login-google-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .btn-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-radius: 14px;
          transition: all 0.3s;
        }

        .login-google-btn:hover:not(:disabled) .btn-bg {
          background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
        }

        .btn-bg::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transform: translateX(-100%);
          transition: transform 0.6s;
        }

        .login-google-btn:hover:not(:disabled) .btn-bg::before {
          transform: translateX(100%);
        }

        .btn-content {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 18px 24px;
          font-size: 16px;
          font-weight: 600;
          color: white;
        }

        .login-google-icon {
          width: 22px;
          height: 22px;
          background: white;
          border-radius: 4px;
          padding: 2px;
        }

        .login-spinner {
          width: 22px;
          height: 22px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .login-divider {
          display: flex;
          align-items: center;
          margin: 32px 0 24px;
        }

        .login-divider::before,
        .login-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
        }

        .login-divider span {
          padding: 0 16px;
          font-size: 11px;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .login-providers {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          margin-bottom: 32px;
        }

        .login-provider {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #475569;
          font-size: 13px;
          padding: 8px 12px;
          border-radius: 8px;
          transition: all 0.3s;
        }

        .login-provider:hover {
          color: #94a3b8;
          background: rgba(255, 255, 255, 0.05);
        }

        .login-provider svg {
          width: 18px;
          height: 18px;
        }

        .login-provider-divider {
          color: #334155;
          font-size: 12px;
        }

        .login-footer {
          text-align: center;
          font-size: 12px;
          color: #475569;
          line-height: 1.5;
          position: relative;
          z-index: 1;
        }
      `}</style>
    </div>
  )
}
