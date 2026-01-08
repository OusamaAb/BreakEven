import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navRef = useRef(null)

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      // Navigation will be handled by auth state change listener in App.jsx
    } catch (error) {
      console.error('Logout error:', error)
      // Fallback: force navigation if auth state change doesn't fire
      navigate('/login', { replace: true })
    }
  }

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/history', label: 'History', icon: '📅' },
    { path: '/subscriptions', label: 'Subscriptions', icon: '📺' },
    { path: '/statistics', label: 'Statistics', icon: '📈' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ]

  const handleNavClick = () => {
    setMobileMenuOpen(false)
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setMobileMenuOpen(false)
      }
    }

    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [mobileMenuOpen])

  return (
    <div className="app-layout">
      {/* Background effects */}
      <div className="app-bg">
        <div className="app-bg-shape app-bg-shape-1"></div>
        <div className="app-bg-shape app-bg-shape-2"></div>
        <div className="app-grid"></div>
      </div>

      {/* Navigation */}
      <nav className="app-nav" ref={navRef}>
        <div className="nav-container">
          <Link to="/" className="nav-logo">
            <div className="nav-logo-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="currentColor" opacity="0.2"/>
                <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <span>BreakEven</span>
          </Link>

          <div className="nav-links">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
              >
                <span className="nav-link-icon">{item.icon}</span>
                <span className="nav-link-text">{item.label}</span>
                {location.pathname === item.path && <div className="nav-link-indicator"></div>}
              </Link>
            ))}
          </div>

          <button onClick={handleLogout} className="nav-logout">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16,17 21,12 16,7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Logout</span>
          </button>

          {/* Mobile Menu Button */}
          <button 
            className="nav-mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileMenuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M3 12h18M3 6h18M3 18h18" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        <div className={`nav-mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <div className="nav-mobile-menu-content">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-mobile-link ${location.pathname === item.path ? 'active' : ''}`}
                onClick={handleNavClick}
              >
                <span className="nav-mobile-link-icon">{item.icon}</span>
                <span className="nav-mobile-link-text">{item.label}</span>
                {location.pathname === item.path && <div className="nav-mobile-link-indicator"></div>}
              </Link>
            ))}
            <button onClick={() => { handleNavClick(); handleLogout(); }} className="nav-mobile-logout">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16,17 21,12 16,7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="app-main">
        <div className="app-content">
          {children}
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .app-layout {
          min-height: 100vh;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #050a15;
          position: relative;
        }

        .app-bg {
          position: fixed;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
        }

        .app-grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(16, 185, 129, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16, 185, 129, 0.02) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse at center, black 0%, transparent 80%);
        }

        .app-bg-shape {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
        }

        .app-bg-shape-1 {
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%);
          top: -200px;
          right: -200px;
          animation: drift 30s ease-in-out infinite;
        }

        .app-bg-shape-2 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, transparent 70%);
          bottom: -150px;
          left: -150px;
          animation: drift 25s ease-in-out infinite reverse;
        }

        @keyframes drift {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, 30px); }
        }

        /* Navigation */
        .app-nav {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(5, 10, 21, 0.8);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .nav-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 32px;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .nav-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: white;
          font-weight: 700;
          font-size: 20px;
          letter-spacing: -0.5px;
        }

        .nav-logo-icon {
          width: 36px;
          height: 36px;
          color: #10b981;
          transition: transform 0.3s;
        }

        .nav-logo:hover .nav-logo-icon {
          transform: rotate(15deg) scale(1.1);
        }

        .nav-links {
          display: flex;
          gap: 8px;
        }

        .nav-link {
          position: relative;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          text-decoration: none;
          color: #64748b;
          font-weight: 500;
          font-size: 14px;
          border-radius: 10px;
          transition: all 0.3s;
        }

        .nav-link:hover {
          color: white;
          background: rgba(255, 255, 255, 0.05);
        }

        .nav-link.active {
          color: white;
          background: rgba(16, 185, 129, 0.1);
        }

        .nav-link-icon {
          font-size: 16px;
          transition: transform 0.3s;
        }

        .nav-link:hover .nav-link-icon {
          transform: scale(1.2);
        }

        .nav-link-indicator {
          position: absolute;
          bottom: -1px;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 3px;
          background: linear-gradient(90deg, #10b981, #3b82f6);
          border-radius: 3px;
        }

        .nav-logout {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 10px;
          color: #f87171;
          font-family: inherit;
          font-weight: 500;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .nav-logout:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.4);
          transform: translateY(-1px);
        }

        .nav-logout svg {
          width: 18px;
          height: 18px;
        }

        /* Main content */
        .app-main {
          position: relative;
          z-index: 1;
          min-height: calc(100vh - 72px);
        }

        .app-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 32px;
        }

        /* Mobile Menu Button */
        .nav-mobile-menu-btn {
          display: none;
        }

        /* Mobile Dropdown Menu */
        .nav-mobile-menu {
          display: none;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .nav-container {
            padding: 0 16px;
            justify-content: space-between;
          }

          .nav-logo span {
            display: none;
          }

          .nav-links,
          .nav-logout {
            display: none;
          }

          .nav-mobile-menu-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            color: white;
            cursor: pointer;
            transition: all 0.3s;
            flex-shrink: 0;
          }

          .nav-mobile-menu-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.2);
          }

          .nav-mobile-menu-btn svg {
            width: 24px;
            height: 24px;
          }

          .nav-mobile-menu {
            display: block;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: rgba(5, 10, 21, 0.98);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease-out, opacity 0.3s ease-out;
            opacity: 0;
            z-index: 99;
          }

          .nav-mobile-menu.open {
            max-height: 500px;
            opacity: 1;
          }

          .nav-mobile-menu-content {
            padding: 12px 16px;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .nav-mobile-link {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 16px;
            text-decoration: none;
            color: #94a3b8;
            font-weight: 500;
            font-size: 15px;
            border-radius: 10px;
            transition: all 0.2s;
            position: relative;
          }

          .nav-mobile-link:hover {
            color: white;
            background: rgba(255, 255, 255, 0.05);
          }

          .nav-mobile-link.active {
            color: white;
            background: rgba(16, 185, 129, 0.15);
          }

          .nav-mobile-link-icon {
            font-size: 20px;
            width: 24px;
            text-align: center;
          }

          .nav-mobile-link-text {
            flex: 1;
          }

          .nav-mobile-link-indicator {
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 4px;
            height: 60%;
            background: linear-gradient(180deg, #10b981, #3b82f6);
            border-radius: 0 4px 4px 0;
          }

          .nav-mobile-logout {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 16px;
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.2);
            border-radius: 10px;
            color: #f87171;
            font-family: inherit;
            font-weight: 500;
            font-size: 15px;
            cursor: pointer;
            transition: all 0.2s;
            margin-top: 8px;
            width: 100%;
            text-align: left;
          }

          .nav-mobile-logout:hover {
            background: rgba(239, 68, 68, 0.2);
            border-color: rgba(239, 68, 68, 0.4);
          }

          .nav-mobile-logout svg {
            width: 20px;
            height: 20px;
          }

          .app-content {
            padding: 20px 16px;
          }
        }
      `}</style>
    </div>
  )
}
