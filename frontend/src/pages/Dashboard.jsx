import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import ExpenseForm from '../components/ExpenseForm'
import ConfirmModal from '../components/ConfirmModal'
import EditExpenseModal from '../components/EditExpenseModal'

export default function Dashboard() {
  const [today, setToday] = useState(null)
  const [budget, setBudget] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [deletingId, setDeletingId] = useState(null)
  const [expenseToDelete, setExpenseToDelete] = useState(null)
  const [deleteError, setDeleteError] = useState(null)
  const [expenseToEdit, setExpenseToEdit] = useState(null)
  const [editLoading, setEditLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [refreshKey])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [todayData, budgetData] = await Promise.all([
        api.getToday(),
        api.getBudget()
      ])
      
      setToday(todayData)
      setBudget(budgetData)

      const todayDate = todayData.date
      const expensesData = await api.getExpenses(todayDate, todayDate)
      setExpenses(expensesData.expenses || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleExpenseCreated = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleDeleteClick = (expense) => {
    setExpenseToDelete(expense)
  }

  const handleConfirmDelete = async () => {
    if (!expenseToDelete) return
    
    try {
      setDeletingId(expenseToDelete.id)
      setExpenseToDelete(null)
      setDeleteError(null)
      await api.deleteExpense(expenseToDelete.id)
      setRefreshKey(prev => prev + 1)
    } catch (err) {
      setDeleteError(err.message)
      // Auto-hide after 5 seconds
      setTimeout(() => setDeleteError(null), 5000)
    } finally {
      setDeletingId(null)
    }
  }

  const handleCancelDelete = () => {
    setExpenseToDelete(null)
  }

  const handleEditClick = (expense) => {
    setExpenseToEdit(expense)
  }

  const handleSaveEdit = async (updatedData) => {
    if (!expenseToEdit) return
    
    try {
      setEditLoading(true)
      await api.updateExpense(expenseToEdit.id, updatedData)
      setExpenseToEdit(null)
      setRefreshKey(prev => prev + 1)
    } catch (err) {
      // Error is handled in the modal
      throw err
    } finally {
      setEditLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setExpenseToEdit(null)
  }

  const formatCents = (cents) => {
    return (cents / 100).toFixed(2)
  }

  const getSpendingStatus = () => {
    if (!today) return 'neutral'
    const percentSpent = (today.spent_cents / today.available_cents) * 100
    if (percentSpent < 50) return 'excellent'
    if (percentSpent < 80) return 'good'
    if (percentSpent < 100) return 'warning'
    return 'over'
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
        <style>{`
          .dashboard-loading {
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
          .dashboard-loading p {
            color: #64748b;
            font-size: 15px;
          }
        `}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <div className="error-icon">⚠️</div>
        <h2>Error Loading Dashboard</h2>
        <p>{error}</p>
        <button onClick={() => loadData()} className="retry-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 4v6h6M23 20v-6h-6"/>
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
          </svg>
          Retry
        </button>
        <style>{`
          .dashboard-error {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            gap: 16px;
            text-align: center;
          }
          .error-icon {
            font-size: 48px;
          }
          .dashboard-error h2 {
            color: #f87171;
            font-size: 24px;
            font-weight: 700;
          }
          .dashboard-error p {
            color: #94a3b8;
            max-width: 400px;
          }
          .retry-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 24px;
            background: linear-gradient(135deg, #10b981, #059669);
            border: none;
            border-radius: 10px;
            color: white;
            font-family: inherit;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
          }
          .retry-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
          }
          .retry-btn svg {
            width: 18px;
            height: 18px;
          }
        `}</style>
      </div>
    )
  }

  if (!today) return null

  const status = getSpendingStatus()
  const percentSpent = Math.min((today.spent_cents / today.available_cents) * 100, 100)

  return (
    <div className="dashboard">
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!expenseToDelete}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Expense?"
        message={expenseToDelete ? `Are you sure you want to delete this ${expenseToDelete.category} expense of $${formatCents(expenseToDelete.amount_cents)}? This will recalculate your budget.` : ''}
        confirmText="Yes, delete it"
        cancelText="Cancel"
        type="danger"
      />

      {/* Edit Expense Modal */}
      <EditExpenseModal
        isOpen={!!expenseToEdit}
        onClose={handleCancelEdit}
        onSave={handleSaveEdit}
        expense={expenseToEdit}
        loading={editLoading}
      />

      {/* Delete Error Toast */}
      {deleteError && (
        <div className="toast toast-error">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>Error deleting expense: {deleteError}</span>
          <button onClick={() => setDeleteError(null)} className="toast-close">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Today's Overview</h1>
          <p className="header-date">
            {new Date(today.date + 'T12:00:00').toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>

      {/* Main Stats */}
      <div className="stats-grid">
        {/* Available Card - Hero */}
        <div className={`stat-card stat-card-hero status-${status}`}>
          <div className="stat-card-glow"></div>
          <div className="stat-header">
            <span className="stat-icon">💰</span>
            <span className="stat-label">Left to Spend</span>
          </div>
          <div className="stat-value-large">
            <span className="currency">$</span>
            <span className="amount">{formatCents(today.available_cents - today.spent_cents)}</span>
          </div>
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${percentSpent}%` }}
              ></div>
            </div>
            <div className="progress-labels">
              <span>{percentSpent.toFixed(0)}% spent</span>
            </div>
          </div>
        </div>

        {/* Spent Card */}
        <div className="stat-card stat-card-spent">
          <div className="stat-header">
            <span className="stat-icon">🛒</span>
            <span className="stat-label">Spent Today</span>
          </div>
          <div className="stat-value">
            <span className="currency">$</span>
            <span className="amount">{formatCents(today.spent_cents)}</span>
          </div>
          <div className="stat-footer">
            <span className="expense-count">{expenses.length} expense{expenses.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Carryover Start */}
        <div className="stat-card stat-card-carryover">
          <div className="stat-header">
            <span className="stat-icon">📥</span>
            <span className="stat-label">Carryover In</span>
          </div>
          <div className="stat-value">
            <span className="currency">$</span>
            <span className="amount">{formatCents(today.carryover_start_cents)}</span>
          </div>
          <div className="stat-footer">
            <span>From yesterday</span>
          </div>
        </div>

        {/* Daily Budget */}
        <div className="stat-card stat-card-daily-budget">
          <div className="stat-header">
            <span className="stat-icon">📊</span>
            <span className="stat-label">Budget</span>
          </div>
          <div className="stat-value">
            <span className="currency">$</span>
            <span className="amount">{budget ? formatCents(budget.base_daily_cents) : '0.00'}</span>
          </div>
          <div className="stat-footer">
            <span>Base allowance</span>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="dashboard-grid">
        {/* Add Expense Form */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>
              <span className="card-icon">➕</span>
              Add Expense
            </h2>
          </div>
          <div className="card-content">
            <ExpenseForm
              defaultDate={today?.date || new Date().toISOString().split('T')[0]}
              onSuccess={handleExpenseCreated}
            />
          </div>
        </div>

        {/* Today's Expenses */}
        <div className="dashboard-card expenses-card">
          <div className="card-header">
            <h2>
              <span className="card-icon">📋</span>
              Today's Expenses
            </h2>
            {expenses.length > 0 && (
              <span className="expense-badge">{expenses.length}</span>
            )}
          </div>
          <div className="card-content">
            {expenses.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎉</div>
                <p>No expenses yet today</p>
                <span>Add your first expense to start tracking</span>
              </div>
            ) : (
              <div className="expenses-list">
                {expenses.map((expense, index) => (
                  <div 
                    key={expense.id} 
                    className="expense-item"
                    style={{ '--delay': `${index * 0.05}s` }}
                    onClick={() => handleEditClick(expense)}
                  >
                    <div className="expense-category">
                      <span className="category-emoji">
                        {getCategoryEmoji(expense.category)}
                      </span>
                      <div className="category-info">
                        <span className="category-name">{expense.category}</span>
                        {expense.note && (
                          <span className="expense-note">{expense.note}</span>
                        )}
                      </div>
                    </div>
                    <div className="expense-right">
                      <span className="expense-amount">
                        ${formatCents(expense.amount_cents)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteClick(expense)
                        }}
                        disabled={deletingId === expense.id}
                        className="delete-btn"
                        title="Delete expense"
                      >
                        {deletingId === expense.id ? (
                          <div className="delete-spinner"></div>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .dashboard {
          animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Header */
        .dashboard-header {
          margin-bottom: 32px;
        }

        .header-content h1 {
          font-size: 32px;
          font-weight: 800;
          color: white;
          letter-spacing: -1px;
          margin-bottom: 8px;
        }

        .header-date {
          color: #64748b;
          font-size: 15px;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 20px;
          margin-bottom: 32px;
        }

        @media (max-width: 1200px) {
          .stats-grid {
            grid-template-columns: 1fr 1fr;
          }
          .stat-card-hero {
            grid-column: span 2;
          }
        }

        @media (max-width: 600px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
          .stat-card-hero {
            grid-column: span 1;
          }
        }

        /* Stat Cards */
        .stat-card {
          position: relative;
          padding: 24px;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.8));
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(20px);
          overflow: hidden;
          transition: all 0.3s;
          animation: slideUp 0.5s ease-out backwards;
        }

        .stat-card:nth-child(1) { animation-delay: 0.1s; }
        .stat-card:nth-child(2) { animation-delay: 0.2s; }
        .stat-card:nth-child(3) { animation-delay: 0.3s; }
        .stat-card:nth-child(4) { animation-delay: 0.4s; }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .stat-card:hover {
          transform: translateY(-4px);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .stat-card-hero {
          padding: 32px;
        }

        .stat-card-glow {
          position: absolute;
          top: -50%;
          right: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 50%);
          pointer-events: none;
        }

        .status-excellent .stat-card-glow { background: radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 50%); }
        .status-good .stat-card-glow { background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 50%); }
        .status-warning .stat-card-glow { background: radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 50%); }
        .status-over .stat-card-glow { background: radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, transparent 50%); }

        .stat-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
          position: relative;
          z-index: 1;
        }

        .stat-icon {
          font-size: 24px;
        }

        .stat-label {
          color: #94a3b8;
          font-size: 14px;
          font-weight: 500;
        }

        .stat-value, .stat-value-large {
          display: flex;
          align-items: baseline;
          gap: 4px;
          position: relative;
          z-index: 1;
        }

        .stat-value .currency {
          color: #64748b;
          font-size: 20px;
          font-weight: 600;
        }

        .stat-value .amount {
          color: white;
          font-size: 32px;
          font-weight: 700;
          letter-spacing: -1px;
        }

        .stat-value-large .currency {
          color: #64748b;
          font-size: 28px;
          font-weight: 600;
        }

        .stat-value-large .amount {
          color: white;
          font-size: 48px;
          font-weight: 800;
          letter-spacing: -2px;
        }

        .stat-card-spent .stat-value .amount { color: #f87171; }

        .stat-footer {
          margin-top: 12px;
          color: #64748b;
          font-size: 13px;
          position: relative;
          z-index: 1;
        }

        .expense-count {
          color: #94a3b8;
        }

        /* Progress Bar */
        .progress-container {
          margin-top: 24px;
          position: relative;
          z-index: 1;
        }

        .progress-bar {
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          border-radius: 10px;
          transition: width 0.8s ease-out;
        }

        .status-excellent .progress-fill { background: linear-gradient(90deg, #10b981, #34d399); }
        .status-good .progress-fill { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
        .status-warning .progress-fill { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
        .status-over .progress-fill { background: linear-gradient(90deg, #ef4444, #f87171); }

        .progress-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 10px;
          font-size: 13px;
          color: #64748b;
        }


        /* Dashboard Grid */
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        @media (max-width: 900px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Cards */
        .dashboard-card {
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.8));
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(20px);
          overflow: hidden;
          animation: slideUp 0.5s ease-out 0.5s backwards;
        }

        .expenses-card {
          animation-delay: 0.6s;
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .card-header h2 {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 18px;
          font-weight: 700;
          color: white;
        }

        .card-icon {
          font-size: 20px;
        }

        .expense-badge {
          padding: 4px 12px;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 20px;
          color: #10b981;
          font-size: 13px;
          font-weight: 600;
        }

        .card-content {
          padding: 24px;
        }

        /* Empty State */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          text-align: center;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
          animation: bounce 2s ease-in-out infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .empty-state p {
          color: white;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .empty-state span {
          color: #64748b;
          font-size: 14px;
        }

        /* Expenses List */
        .expenses-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 400px;
          overflow-y: auto;
        }

        .expense-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.04);
          transition: all 0.3s;
          animation: slideIn 0.3s ease-out backwards;
          animation-delay: var(--delay);
          cursor: pointer;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .expense-item:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(59, 130, 246, 0.3);
          transform: translateX(4px);
        }

        .expense-category {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .category-emoji {
          font-size: 28px;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
        }

        .category-info {
          display: flex;
          flex-direction: column;
        }

        .category-name {
          color: white;
          font-weight: 600;
          font-size: 15px;
        }

        .expense-note {
          color: #64748b;
          font-size: 13px;
          margin-top: 2px;
        }

        .expense-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .expense-amount {
          color: #f87171;
          font-size: 18px;
          font-weight: 700;
        }

        .delete-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #f87171;
        }

        .delete-btn:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.2);
          transform: scale(1.1);
        }

        .delete-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .delete-btn svg {
          width: 18px;
          height: 18px;
        }

        .delete-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(248, 113, 113, 0.3);
          border-top-color: #f87171;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Toast Notification */
        .toast {
          position: fixed;
          bottom: 24px;
          right: 24px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 500;
          z-index: 1000;
          animation: toastIn 0.4s ease-out;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
        }

        @keyframes toastIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .toast-error {
          background: linear-gradient(135deg, rgba(127, 29, 29, 0.95), rgba(153, 27, 27, 0.9));
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fecaca;
        }

        .toast svg:first-child {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
          color: #f87171;
        }

        .toast-close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 6px;
          color: #fecaca;
          cursor: pointer;
          margin-left: 8px;
          transition: all 0.2s;
        }

        .toast-close:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .toast-close svg {
          width: 14px;
          height: 14px;
        }
      `}</style>
    </div>
  )
}

// Helper function for category emojis
function getCategoryEmoji(category) {
  const categoryLower = category.toLowerCase()
  const emojiMap = {
    food: '🍔',
    restaurant: '🍽️',
    coffee: '☕',
    groceries: '🛒',
    transport: '🚗',
    uber: '🚕',
    gas: '⛽',
    entertainment: '🎬',
    shopping: '🛍️',
    clothes: '👕',
    health: '💊',
    gym: '💪',
    bills: '📄',
    utilities: '💡',
    phone: '📱',
    internet: '📶',
    subscription: '📺',
    travel: '✈️',
    hotel: '🏨',
    education: '📚',
    gifts: '🎁',
    pet: '🐾',
    home: '🏠',
    repair: '🔧',
    other: '💵',
  }

  for (const [key, emoji] of Object.entries(emojiMap)) {
    if (categoryLower.includes(key)) return emoji
  }
  return '💵'
}
