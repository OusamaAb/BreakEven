import { useState } from 'react'
import { api } from '../lib/api'

export default function ExpenseForm({ defaultDate, onSuccess }) {
  const [formData, setFormData] = useState({
    date: defaultDate || new Date().toISOString().split('T')[0],
    amount_cents: '',
    category: '',
    note: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  const categories = [
    { value: 'food', label: 'Food & Dining', emoji: '🍔' },
    { value: 'groceries', label: 'Groceries', emoji: '🛒' },
    { value: 'transport', label: 'Transport', emoji: '🚗' },
    { value: 'entertainment', label: 'Entertainment', emoji: '🎬' },
    { value: 'shopping', label: 'Shopping', emoji: '🛍️' },
    { value: 'health', label: 'Health', emoji: '💊' },
    { value: 'bills', label: 'Bills', emoji: '📄' },
    { value: 'coffee', label: 'Coffee', emoji: '☕' },
    { value: 'other', label: 'Other', emoji: '💵' },
  ]

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
    setSuccess(false)
  }

  const validateForm = () => {
    const errors = {}
    
    const amount = parseFloat(formData.amount_cents)
    if (!formData.amount_cents || formData.amount_cents === '') {
      errors.amount_cents = 'Please enter an amount'
    } else if (isNaN(amount) || amount <= 0) {
      errors.amount_cents = 'Amount must be greater than $0'
    }
    
    if (!formData.category) {
      errors.category = 'Please select a category'
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
      setSuccess(false)

      const amountCents = Math.round(parseFloat(formData.amount_cents) * 100)

      await api.createExpense({
        date: formData.date,
        amount_cents: amountCents,
        category: formData.category,
        note: formData.note || null,
      })

      setSuccess(true)
      setFormData({
        date: defaultDate || new Date().toISOString().split('T')[0],
        amount_cents: '',
        category: '',
        note: '',
      })
      setFieldErrors({})

      if (onSuccess) {
        onSuccess()
      }

      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="expense-form" noValidate>
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
            className={fieldErrors.amount_cents ? 'input-error' : ''}
          />
        </div>
        {fieldErrors.amount_cents && (
          <span className="field-error">{fieldErrors.amount_cents}</span>
        )}
      </div>

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

      <div className="form-group">
        <label>
          <span className="label-icon">📝</span>
          Note <span className="optional">(optional)</span>
          <span className={`char-count ${formData.note.length > 25 ? 'warning' : ''} ${formData.note.length >= 30 ? 'limit' : ''}`}>
            {formData.note.length}/30
          </span>
        </label>
        <textarea
          name="note"
          value={formData.note}
          onChange={handleChange}
          rows="2"
          maxLength={30}
          placeholder="Add details..."
        />
      </div>

      {error && (
        <div className="form-error">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {success && (
        <div className="form-success">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Expense added successfully!
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="submit-btn"
      >
        {loading ? (
          <>
            <div className="btn-spinner"></div>
            Adding...
          </>
        ) : (
          <>
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Expense
          </>
        )}
      </button>

      <style>{`
        .expense-form {
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

        .optional {
          color: #475569;
          font-weight: 400;
        }

        .char-count {
          margin-left: auto;
          font-size: 12px;
          font-weight: 500;
          color: #475569;
          transition: color 0.2s;
        }

        .char-count.warning {
          color: #f59e0b;
        }

        .char-count.limit {
          color: #ef4444;
        }

        .form-group input,
        .form-group textarea {
          padding: 14px 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          color: white;
          font-family: inherit;
          font-size: 15px;
          transition: all 0.3s;
        }

        .form-group input::placeholder,
        .form-group textarea::placeholder {
          color: #475569;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.05);
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }

        /* Input error state */
        .form-group input.input-error,
        .form-group textarea.input-error {
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.05);
        }

        .form-group input.input-error:focus,
        .form-group textarea.input-error:focus {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }

        .field-error {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #f87171;
          font-size: 13px;
          margin-top: 4px;
          animation: shake 0.4s ease-out;
        }

        .field-error::before {
          content: '⚠';
          font-size: 12px;
        }

        .field-error-inline {
          margin-left: auto;
          color: #f87171;
          font-size: 12px;
          font-weight: 500;
          animation: shake 0.4s ease-out;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-4px); }
          40%, 80% { transform: translateX(4px); }
        }

        .form-group textarea {
          resize: none;
          height: 60px;
        }

        /* Date input styling */
        .form-group input[type="date"] {
          color-scheme: dark;
        }

        /* Input with prefix */
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
          width: 100%;
        }

        /* Hide number input arrows */
        .input-with-prefix input[type="number"]::-webkit-outer-spin-button,
        .input-with-prefix input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .input-with-prefix input[type="number"] {
          -moz-appearance: textfield;
        }

        /* Category Grid */
        .category-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          padding: 4px;
          border-radius: 14px;
          transition: all 0.3s;
        }

        .category-grid.category-error {
          background: rgba(239, 68, 68, 0.05);
          box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.3);
        }

        @media (max-width: 600px) {
          .category-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .category-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 14px 10px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s;
          font-family: inherit;
        }

        .category-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }

        .category-btn.active {
          background: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.4);
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.1);
        }

        .category-emoji {
          font-size: 24px;
          transition: transform 0.3s;
        }

        .category-btn:hover .category-emoji {
          transform: scale(1.2);
        }

        .category-btn.active .category-emoji {
          transform: scale(1.1);
        }

        .category-label {
          color: #64748b;
          font-size: 12px;
          font-weight: 500;
          text-align: center;
          transition: color 0.3s;
        }

        .category-btn.active .category-label {
          color: #10b981;
        }

        /* Messages */
        .form-error,
        .form-success {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 16px;
          border-radius: 12px;
          font-size: 14px;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .form-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #f87171;
        }

        .form-success {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: #34d399;
        }

        .form-error svg,
        .form-success svg {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        /* Submit Button */
        .submit-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
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
          position: relative;
          overflow: hidden;
        }

        .submit-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transform: translateX(-100%);
          transition: transform 0.6s;
        }

        .submit-btn:hover:not(:disabled)::before {
          transform: translateX(100%);
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
        }

        .submit-btn:active:not(:disabled) {
          transform: translateY(0) scale(0.98);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .submit-btn svg {
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
    </form>
  )
}
