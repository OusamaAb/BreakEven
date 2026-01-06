import { useState, useEffect } from 'react'
import { api } from '../lib/api'

const getLocalISODate = () => {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  const local = new Date(now.getTime() - offset * 60000)
  return local.toISOString().split('T')[0]
}

export default function SubscriptionForm({ subscription, onSuccess, onCancel, isModal = false }) {
  const isEditing = !!subscription

  const [formData, setFormData] = useState({
    name: '',
    amount_cents: '',
    billing_cycle: 'monthly',
    category: '',
    status: 'active',
    start_date: getLocalISODate(), // Default to today (local)
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})

  // Subscription-specific categories
  const categories = [
    { value: 'streaming', label: 'Streaming', emoji: '📺' },
    { value: 'software', label: 'Software', emoji: '💻' },
    { value: 'music', label: 'Music', emoji: '🎵' },
    { value: 'news', label: 'News', emoji: '📰' },
    { value: 'fitness', label: 'Fitness', emoji: '💪' },
    { value: 'cloud_storage', label: 'Cloud Storage', emoji: '☁️' },
    { value: 'gaming', label: 'Gaming', emoji: '🎮' },
    { value: 'other', label: 'Other', emoji: '💳' },
  ]

  // Load subscription data if editing
  useEffect(() => {
    if (subscription) {
      setFormData({
        name: subscription.name || '',
        amount_cents: (subscription.amount_cents / 100).toFixed(2),
        billing_cycle: subscription.billing_cycle || 'monthly',
        category: subscription.category || '',
        status: subscription.status || 'active',
      })
    }
  }, [subscription])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: null }))
    }
    setError(null)
  }

  const validateForm = () => {
    const errors = {}
    
    if (!formData.name || formData.name.trim() === '') {
      errors.name = 'Please enter a subscription name'
    }
    
    const amount = parseFloat(formData.amount_cents)
    if (!formData.amount_cents || formData.amount_cents === '') {
      errors.amount_cents = 'Please enter an amount'
    } else if (isNaN(amount) || amount <= 0) {
      errors.amount_cents = 'Amount must be greater than $0'
    }
    
    if (!formData.category) {
      errors.category = 'Please select a category'
    }
    
    // Validate start_date only when creating (not editing)
    if (!isEditing) {
      if (!formData.start_date) {
        errors.start_date = 'Please select a start date'
      } else {
        const startDate = new Date(formData.start_date + 'T00:00:00')
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        if (startDate > today) {
          errors.start_date = 'Start date cannot be in the future'
        }
      }
    }
    
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Custom validation
    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)
      setError(null)

      const amountCents = Math.round(parseFloat(formData.amount_cents) * 100)

      const payload = {
        name: formData.name.trim(),
        amount_cents: amountCents,
        billing_cycle: formData.billing_cycle,
        category: formData.category,
        status: formData.status,
      }

      // Only include start_date when creating (not editing)
      if (!isEditing && formData.start_date) {
        payload.start_date = formData.start_date
      }

      if (isEditing) {
        await api.updateSubscription(subscription.id, payload)
      } else {
        await api.createSubscription(payload)
      }

      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formContent = (
    <form onSubmit={handleSubmit} className="subscription-form" noValidate>
      <div className="form-group">
        <label>
          <span className="label-icon">📝</span>
          Subscription Name
          {fieldErrors.name && (
            <span className="field-error-inline">{fieldErrors.name}</span>
          )}
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Netflix, Spotify, Adobe Creative Cloud"
          className={fieldErrors.name ? 'input-error' : ''}
        />
      </div>

      <div className="form-group">
        <label>
          <span className="label-icon">💵</span>
          Amount
        </label>
        <div className="input-with-prefix">
          <span className="input-prefix">$</span>
          <input
            type="number"
            name="amount_cents"
            value={formData.amount_cents}
            onChange={handleChange}
            step="0.01"
            min="0.01"
            placeholder="0.00"
            className={`no-spinner ${fieldErrors.amount_cents ? 'input-error' : ''}`}
            onWheel={(e) => e.target.blur()}
            onKeyDown={(e) => {
              if (['ArrowUp', 'ArrowDown'].includes(e.key)) {
                e.preventDefault()
              }
            }}
          />
        </div>
        {fieldErrors.amount_cents && (
          <span className="field-error">{fieldErrors.amount_cents}</span>
        )}
      </div>

      <div className="form-group">
        <label>
          <span className="label-icon">🔄</span>
          Billing Cycle
        </label>
        <select
          name="billing_cycle"
          value={formData.billing_cycle}
          onChange={handleChange}
        >
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      {!isEditing && (
        <div className="form-group">
          <label>
            <span className="label-icon">📅</span>
            Start Date
            {fieldErrors.start_date && (
              <span className="field-error-inline">{fieldErrors.start_date}</span>
            )}
          </label>
          <input
            type="date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            max={getLocalISODate()}
            onFocus={(e) => e.target.showPicker && e.target.showPicker()}
            onClick={(e) => e.target.showPicker && e.target.showPicker()}
            className={fieldErrors.start_date ? 'input-error' : ''}
          />
          <span className="input-hint">When did you start this subscription?</span>
        </div>
      )}

      <div className="form-group">
        <label>
          <span className="label-icon">🏷️</span>
          Category
          {fieldErrors.category && (
            <span className="field-error-inline">{fieldErrors.category}</span>
          )}
        </label>
        <div className={`category-grid ${fieldErrors.category ? 'category-error' : ''}`}>
          {categories.map(cat => (
            <button
              key={cat.value}
              type="button"
              className={`category-btn ${formData.category === cat.value ? 'active' : ''}`}
              onClick={() => {
                setFormData(prev => ({ ...prev, category: cat.value }))
                if (fieldErrors.category) {
                  setFieldErrors(prev => ({ ...prev, category: null }))
                }
              }}
            >
              <span className="category-emoji">{cat.emoji}</span>
              <span className="category-label">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {isEditing && (
        <div className="form-group">
          <label>
            <span className="label-icon">⚡</span>
            Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>
        </div>
      )}

      {error && (
        <div className="form-error">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      <div className="form-actions">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="cancel-btn"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="submit-btn"
        >
          {loading ? (
            <>
              <div className="btn-spinner"></div>
              {isEditing ? 'Saving...' : 'Adding...'}
            </>
          ) : (
            <>
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {isEditing ? 'Save Changes' : 'Add Subscription'}
            </>
          )}
        </button>
      </div>

      <style>{`
        .subscription-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #94a3b8;
          font-size: 14px;
          font-weight: 500;
          flex-wrap: wrap;
        }

        .label-icon {
          font-size: 16px;
        }

        .field-error-inline {
          margin-left: auto;
          color: #f87171;
          font-size: 12px;
          font-weight: 400;
        }

        .form-group input[type="text"],
        .form-group input[type="number"],
        .form-group input[type="date"],
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
          color-scheme: dark;
        }

        .form-group select {
          cursor: pointer;
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 20 20' fill='currentColor' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'%3E%3C/path%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 16px center;
          background-size: 1.2em;
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

        .input-error {
          border-color: #f87171 !important;
          background: rgba(239, 68, 68, 0.05) !important;
        }

        .field-error {
          color: #f87171;
          font-size: 12px;
          margin-top: -4px;
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
          padding-left: 42px !important;
        }

        .input-hint {
          display: block;
          margin-top: 8px;
          color: #475569;
          font-size: 13px;
        }

        input[type="number"].no-spinner::-webkit-outer-spin-button,
        input[type="number"].no-spinner::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"].no-spinner {
          -moz-appearance: textfield;
        }

        .category-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 10px;
        }

        .category-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 12px 8px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          color: #94a3b8;
          font-family: inherit;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .category-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.12);
        }

        .category-btn.active {
          background: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.4);
          color: #10b981;
        }

        .category-emoji {
          font-size: 24px;
        }

        .category-label {
          font-weight: 500;
        }

        .category-error .category-btn {
          border-color: rgba(239, 68, 68, 0.3);
        }

        .form-error {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 12px;
          color: #f87171;
          font-size: 14px;
        }

        .form-error svg {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        .form-actions {
          display: flex;
          gap: 12px;
        }

        .cancel-btn {
          flex: 1;
          padding: 14px 20px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          color: #94a3b8;
          font-family: inherit;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
        }

        .cancel-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.12);
        }

        .cancel-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .submit-btn {
          flex: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 20px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border: none;
          border-radius: 12px;
          color: white;
          font-family: inherit;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
          overflow: hidden;
        }

        .submit-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }

        .submit-btn:hover:not(:disabled)::before {
          left: 100%;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .submit-btn svg {
          width: 18px;
          height: 18px;
        }

        .btn-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </form>
  )

  if (isModal) {
    return (
      <div className="modal-overlay" onClick={onCancel}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>{isEditing ? 'Edit Subscription' : 'Add Subscription'}</h2>
            <button className="modal-close" onClick={onCancel}>
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div className="modal-body">
            {formContent}
          </div>
        </div>
        <style>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            animation: fadeIn 0.2s ease-out;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .modal-content {
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95));
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            width: 90%;
            max-width: 500px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            animation: slideUp 0.3s ease-out;
          }

          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 24px 24px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            margin-bottom: 24px;
            padding-bottom: 20px;
          }

          .modal-header h2 {
            color: white;
            font-size: 24px;
            font-weight: 700;
            margin: 0;
          }

          .modal-close {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: #94a3b8;
            transition: all 0.2s;
          }

          .modal-close:hover {
            background: rgba(255, 255, 255, 0.1);
            color: white;
          }

          .modal-close svg {
            width: 20px;
            height: 20px;
          }

          .modal-body {
            padding: 0 24px 24px;
          }
        `}</style>
      </div>
    )
  }

  return formContent
}
