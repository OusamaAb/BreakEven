import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Layout({ children }) {
  const location = useLocation()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/history', label: 'History', icon: '📅' },
    { path: '/subscriptions', label: 'Subscriptions', icon: '📺' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ]

  return (
    <div className="app-layout">
      {/* Background effects */}
      <div className="app-bg">
        <div className="app-bg-shape app-bg-shape-1"></div>
        <div className="app-bg-shape app-bg-shape-2"></div>
        <div className="app-grid"></div>
      </div>

      {/* Navigation */}
      <nav className="app-nav">
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

        /* Responsive */
        @media (max-width: 768px) {
          .nav-container {
            padding: 0 16px;
          }

          .nav-link-text {
            display: none;
          }

          .nav-link {
            padding: 10px 14px;
          }

          .nav-logout span {
            display: none;
          }

          .nav-logout {
            padding: 10px 14px;
          }

          .app-content {
            padding: 20px 16px;
          }
        }
      `}</style>
    </div>
  )
}
