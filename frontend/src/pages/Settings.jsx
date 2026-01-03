import { useState, useEffect } from 'react'
import { api } from '../lib/api'

export default function Settings() {
  const [budget, setBudget] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [startDate, setStartDate] = useState(null)

  const [formData, setFormData] = useState({
    base_daily_cents: 2000,
    currency: 'CAD',
    timezone: 'America/Toronto',
    carryover_mode: 'continuous',
    displayValue: undefined,
  })

  const [effectiveOption, setEffectiveOption] = useState('today') // 'all', 'today', 'custom'
  const [customDate, setCustomDate] = useState('')

  useEffect(() => {
    loadBudget()
  }, [])

  const loadBudget = async () => {
    try {
      setLoading(true)
      const data = await api.getBudget()
      setBudget(data)
      setFormData({
        base_daily_cents: data.base_daily_cents,
        currency: data.currency,
        timezone: data.timezone,
        carryover_mode: data.carryover_mode || 'continuous',
        displayValue: undefined,
      })
      
      // Get start date from daily endpoint
      const todayData = await api.getToday()
      if (todayData.start_date) {
        setStartDate(todayData.start_date)
      }
      
      // Set default custom date to today
      setCustomDate(new Date().toISOString().split('T')[0])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.base_daily_cents || formData.base_daily_cents < 1) {
      setError('Please enter a valid daily allowance')
      return
    }

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      // Determine effective_from date
      let effective_from = null
      if (effectiveOption === 'today') {
        effective_from = new Date().toISOString().split('T')[0]
      } else if (effectiveOption === 'custom') {
        effective_from = customDate
      }
      // 'all' means null (recalculate from beginning)

      await api.updateBudget({
        base_daily_cents: formData.base_daily_cents,
        currency: formData.currency,
        timezone: formData.timezone,
        carryover_mode: formData.carryover_mode,
        effective_from: effective_from,
      })
      
      const effectiveText = effectiveOption === 'all' 
        ? 'All history recalculated' 
        : effectiveOption === 'today' 
          ? 'Changes effective from today'
          : `Changes effective from ${new Date(customDate + 'T12:00:00').toLocaleDateString()}`
      
      setSuccess(`Budget updated! ${effectiveText}`)
      await loadBudget()
      
      setTimeout(() => setSuccess(null), 4000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'base_daily_cents' ? parseInt(value) || 0 : value
    }))
    setError(null)
  }

  // Get minimum date (start date) for the custom date picker
  const minDate = startDate || new Date().toISOString().split('T')[0]
  const maxDate = new Date().toISOString().split('T')[0]

  if (loading) {
    return (
      <div className="settings-loading">
        <div className="loading-spinner"></div>
        <p>Loading settings...</p>
        <style>{`
          .settings-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            gap: 20px;
          }
          .loading-spinner {
            width: 48px;
            height: 48px;
            border: 3px solid rgba(16, 185, 129, 0.1);
            border-top-color: #10b981;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .settings-loading p {
            color: #64748b;
            font-size: 15px;
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Budget Settings</h1>
        <p>Configure your daily allowance and preferences</p>
      </div>

      <div className="settings-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              <span className="label-icon">💵</span>
              Daily Allowance
            </label>
            <div className="input-with-prefix">
              <span className="input-prefix">$</span>
              <input
                type="text"
                inputMode="decimal"
                name="base_daily_cents"
                value={formData.displayValue !== undefined ? formData.displayValue : (formData.base_daily_cents / 100).toFixed(2)}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                    const cents = value === '' ? 0 : Math.round(parseFloat(value) * 100) || 0
                    setFormData(prev => ({ ...prev, base_daily_cents: cents, displayValue: value }))
                    setError(null)
                  }
                }}
                onBlur={() => {
                  setFormData(prev => ({ ...prev, displayValue: undefined }))
                }}
                placeholder="0.00"
                required
                className="no-spinner"
              />
            </div>
            <span className="input-hint">Your daily spending limit</span>
          </div>

          {/* Effective Date Options */}
          <div className="form-group effective-section">
            <label>
              <span className="label-icon">📅</span>
              When should the new allowance take effect?
            </label>
            
            <div className="effective-options">
              <button
                type="button"
                className={`effective-btn ${effectiveOption === 'today' ? 'active' : ''}`}
                onClick={() => setEffectiveOption('today')}
              >
                <span className="effective-icon">📍</span>
                <div className="effective-content">
                  <span className="effective-title">Starting Today</span>
                  <span className="effective-desc">Past days stay unchanged</span>
                </div>
              </button>

              <button
                type="button"
                className={`effective-btn ${effectiveOption === 'all' ? 'active' : ''}`}
                onClick={() => setEffectiveOption('all')}
              >
                <span className="effective-icon">🔄</span>
                <div className="effective-content">
                  <span className="effective-title">Recalculate All</span>
                  <span className="effective-desc">Apply to entire history</span>
                </div>
              </button>

              <button
                type="button"
                className={`effective-btn ${effectiveOption === 'custom' ? 'active' : ''}`}
                onClick={() => setEffectiveOption('custom')}
              >
                <span className="effective-icon">🎯</span>
                <div className="effective-content">
                  <span className="effective-title">Custom Date</span>
                  <span className="effective-desc">Choose a specific start</span>
                </div>
              </button>
            </div>

            {effectiveOption === 'custom' && (
              <div className="custom-date-picker">
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  min={minDate}
                  max={maxDate}
                />
                <span className="date-hint">
                  Changes will apply from {customDate ? new Date(customDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'selected date'} onwards
                </span>
              </div>
            )}
          </div>

          {/* Carryover Mode */}
          <div className="form-group carryover-section">
            <label>
              <span className="label-icon">🔄</span>
              Carryover Mode
            </label>
            
            <div className="carryover-options">
              <button
                type="button"
                className={`carryover-btn ${formData.carryover_mode === 'continuous' ? 'active' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, carryover_mode: 'continuous' }))}
              >
                <span className="carryover-icon">📈</span>
                <div className="carryover-content">
                  <span className="carryover-title">Continuous</span>
                  <span className="carryover-desc">Carryover accumulates across months</span>
                </div>
              </button>

              <button
                type="button"
                className={`carryover-btn ${formData.carryover_mode === 'monthly_reset' ? 'active' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, carryover_mode: 'monthly_reset' }))}
              >
                <span className="carryover-icon">🔄</span>
                <div className="carryover-content">
                  <span className="carryover-title">Fresh Start Monthly</span>
                  <span className="carryover-desc">Resets to zero on the 1st of each month</span>
                </div>
              </button>
            </div>
            <span className="input-hint">
              {formData.carryover_mode === 'continuous' 
                ? 'Great for tracking long-term savings' 
                : 'Great for monthly budgeting without rollover'}
            </span>
          </div>

          <div className="form-group">
            <label>
              <span className="label-icon">💱</span>
              Currency
            </label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              required
            >
              <option value="CAD">🇨🇦 CAD (Canadian Dollar)</option>
              <option value="USD">🇺🇸 USD (US Dollar)</option>
              <option value="EUR">🇪🇺 EUR (Euro)</option>
              <option value="GBP">🇬🇧 GBP (British Pound)</option>
            </select>
          </div>

          <div className="form-group">
            <label>
              <span className="label-icon">🌍</span>
              Timezone
            </label>
            <select
              name="timezone"
              value={formData.timezone}
              onChange={handleChange}
              required
            >
              <option value="America/Toronto">America/Toronto (Eastern)</option>
              <option value="America/New_York">America/New_York (Eastern)</option>
              <option value="America/Chicago">America/Chicago (Central)</option>
              <option value="America/Denver">America/Denver (Mountain)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (Pacific)</option>
              <option value="UTC">UTC</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="Europe/Paris">Europe/Paris (CET)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
            </select>
            <span className="input-hint">Used for daily reset timing</span>
          </div>

          {error && (
            <div className="message message-error">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {success && (
            <div className="message message-success">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {success}
            </div>
          )}

          <button type="submit" disabled={saving} className="save-btn">
            {saving ? (
              <>
                <div className="btn-spinner"></div>
                Saving...
              </>
            ) : (
              <>
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Save Settings
              </>
            )}
          </button>
        </form>
      </div>

      <style>{`
        .settings-page {
          animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .settings-header {
          margin-bottom: 32px;
        }

        .settings-header h1 {
          font-size: 32px;
          font-weight: 800;
          color: white;
          letter-spacing: -1px;
          margin-bottom: 8px;
        }

        .settings-header p {
          color: #64748b;
          font-size: 15px;
        }

        .settings-card {
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.8));
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(20px);
          padding: 32px;
          max-width: 500px;
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #94a3b8;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 10px;
        }

        .label-icon {
          font-size: 18px;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 14px 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          color: white;
          font-family: inherit;
          font-size: 15px;
          transition: all 0.3s;
        }

        .form-group select {
          cursor: pointer;
        }

        .form-group select option {
          background: #1e293b;
          color: white;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.05);
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }

        .input-with-prefix {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-prefix {
          position: absolute;
          left: 16px;
          color: #64748b;
          font-size: 16px;
          font-weight: 500;
          pointer-events: none;
        }

        .input-with-prefix input {
          padding-left: 36px;
        }

        /* Hide number input arrows */
        input.no-spinner::-webkit-outer-spin-button,
        input.no-spinner::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input.no-spinner {
          -moz-appearance: textfield;
        }

        .input-hint {
          display: block;
          margin-top: 8px;
          color: #475569;
          font-size: 13px;
        }

        /* Effective Date Section */
        .effective-section {
          padding: 20px;
          background: rgba(16, 185, 129, 0.03);
          border: 1px solid rgba(16, 185, 129, 0.1);
          border-radius: 16px;
          margin-bottom: 24px;
        }

        .effective-options {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .effective-btn {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s;
          text-align: left;
          font-family: inherit;
        }

        .effective-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .effective-btn.active {
          background: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.4);
        }

        .effective-icon {
          font-size: 24px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          transition: all 0.3s;
        }

        .effective-btn.active .effective-icon {
          background: rgba(16, 185, 129, 0.15);
        }

        .effective-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .effective-title {
          color: white;
          font-size: 14px;
          font-weight: 600;
        }

        .effective-desc {
          color: #64748b;
          font-size: 12px;
        }

        .effective-btn.active .effective-title {
          color: #10b981;
        }

        /* Carryover Mode Section */
        .carryover-section {
          padding: 20px;
          background: rgba(59, 130, 246, 0.03);
          border: 1px solid rgba(59, 130, 246, 0.1);
          border-radius: 16px;
          margin-bottom: 24px;
        }

        .carryover-options {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 12px;
        }

        .carryover-btn {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s;
          text-align: left;
          font-family: inherit;
        }

        .carryover-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .carryover-btn.active {
          background: rgba(59, 130, 246, 0.1);
          border-color: rgba(59, 130, 246, 0.4);
        }

        .carryover-icon {
          font-size: 24px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          transition: all 0.3s;
        }

        .carryover-btn.active .carryover-icon {
          background: rgba(59, 130, 246, 0.15);
        }

        .carryover-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .carryover-title {
          color: white;
          font-size: 14px;
          font-weight: 600;
        }

        .carryover-desc {
          color: #64748b;
          font-size: 12px;
        }

        .carryover-btn.active .carryover-title {
          color: #60a5fa;
        }

        /* Custom Date Picker */
        .custom-date-picker {
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .custom-date-picker input[type="date"] {
          width: 100%;
          padding: 12px 14px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          color: white;
          font-family: inherit;
          font-size: 14px;
          color-scheme: dark;
        }

        .custom-date-picker input[type="date"]:focus {
          outline: none;
          border-color: #10b981;
        }

        .date-hint {
          display: block;
          margin-top: 8px;
          color: #10b981;
          font-size: 13px;
        }

        .message {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 16px;
          border-radius: 12px;
          font-size: 14px;
          margin-bottom: 20px;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .message svg {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        .message-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #f87171;
        }

        .message-success {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: #34d399;
        }

        .save-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 16px 24px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border: none;
          border-radius: 12px;
          color: white;
          font-family: inherit;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .save-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
        }

        .save-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .save-btn svg {
          width: 20px;
          height: 20px;
        }

        .btn-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
