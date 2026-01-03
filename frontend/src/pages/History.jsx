import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'
import EditExpenseModal from '../components/EditExpenseModal'
import ConfirmModal from '../components/ConfirmModal'

export default function History() {
  const [ledgers, setLedgers] = useState([])
  const [expenses, setExpenses] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [availableMonths, setAvailableMonths] = useState([])
  const [selectedMonth, setSelectedMonth] = useState('')
  const [startDate, setStartDate] = useState(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  
  // Edit/Delete/Add state
  const [expenseToEdit, setExpenseToEdit] = useState(null)
  const [expenseToDelete, setExpenseToDelete] = useState(null)
  const [addingForDate, setAddingForDate] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Load budget info to get start date
  useEffect(() => {
    loadBudgetInfo()
  }, [])

  // Load data when month changes
  useEffect(() => {
    if (selectedMonth) {
      loadData()
    }
  }, [selectedMonth])

  const loadBudgetInfo = async () => {
    try {
      setLoading(true)
      const today = new Date().toISOString().split('T')[0]
      const response = await api.getDailyRange(today, today)
      
      const budgetStartDate = response.start_date ? new Date(response.start_date + 'T00:00:00') : new Date()
      setStartDate(budgetStartDate)
      
      const months = generateMonthsList(budgetStartDate)
      setAvailableMonths(months)
      
      if (months.length > 0) {
        setSelectedMonth(months[0].value)
      }
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const generateMonthsList = (startDate) => {
    const months = []
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()
    
    const startYear = startDate.getFullYear()
    const startMonth = startDate.getMonth()
    
    for (let year = currentYear; year >= startYear; year--) {
      const monthStart = year === currentYear ? currentMonth : 11
      const monthEnd = year === startYear ? startMonth : 0
      
      for (let month = monthStart; month >= monthEnd; month--) {
        const date = new Date(year, month, 1)
        const isCurrentMonth = year === currentYear && month === currentMonth
        months.push({
          value: `${year}-${String(month + 1).padStart(2, '0')}`,
          label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          shortLabel: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          year,
          month,
          isCurrentMonth
        })
      }
    }
    
    return months
  }

  const getMonthDateRange = (monthValue) => {
    const [year, month] = monthValue.split('-').map(Number)
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    
    const effectiveFirstDay = startDate && firstDay < startDate ? startDate : firstDay
    
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    const effectiveLastDay = lastDay > today ? new Date() : lastDay
    
    return {
      from: effectiveFirstDay.toISOString().split('T')[0],
      to: effectiveLastDay.toISOString().split('T')[0]
    }
  }

  const loadData = async (keepExpenses = false) => {
    try {
      setLoading(true)
      setError(null)
      
      const { from, to } = getMonthDateRange(selectedMonth)
      const ledgersData = await api.getDailyRange(from, to)
      setLedgers(ledgersData.ledgers || [])
      // Only clear cached expenses when month changes, not on refresh
      if (!keepExpenses) {
        setExpenses({})
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadExpensesForDate = async (date, forceReload = false) => {
    // Skip if already loaded and not forcing reload
    if (expenses[date] && !forceReload) return
    
    try {
      const expensesData = await api.getExpenses(date, date)
      setExpenses(prev => ({
        ...prev,
        [date]: expensesData.expenses || []
      }))
    } catch (err) {
      // Silently fail for individual expense loading
    }
  }

  // Refresh ledgers and expenses for a specific date
  const refreshAfterChange = async (date) => {
    try {
      // Reload ledgers (keeping expenses cache)
      const { from, to } = getMonthDateRange(selectedMonth)
      const ledgersData = await api.getDailyRange(from, to)
      setLedgers(ledgersData.ledgers || [])
      
      // Reload expenses for the affected date
      const expensesData = await api.getExpenses(date, date)
      setExpenses(prev => ({
        ...prev,
        [date]: expensesData.expenses || []
      }))
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDateClick = (date) => {
    if (selectedDate === date) {
      setSelectedDate(null)
    } else {
      setSelectedDate(date)
      loadExpensesForDate(date, false) // Don't force reload when just clicking
    }
  }

  const handleMonthSelect = (monthValue) => {
    setSelectedMonth(monthValue)
    setDropdownOpen(false)
    setSelectedDate(null)
  }

  const handleExpenseClick = (expense) => {
    setExpenseToEdit(expense)
  }

  const handleEditSuccess = async () => {
    const editedDate = expenseToEdit?.date
    setExpenseToEdit(null)
    if (editedDate) {
      await refreshAfterChange(editedDate)
    }
  }

  const handleDeleteClick = (e, expense) => {
    e.stopPropagation()
    setExpenseToDelete(expense)
  }

  const handleConfirmDelete = async () => {
    if (!expenseToDelete) return
    
    const deletedDate = expenseToDelete.date
    try {
      setDeletingId(expenseToDelete.id)
      setExpenseToDelete(null)
      await api.deleteExpense(expenseToDelete.id)
      // Refresh the affected date
      await refreshAfterChange(deletedDate)
    } catch (err) {
      setError(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  const handleAddExpense = (date) => {
    setAddingForDate(date)
  }

  const handleAddSuccess = async () => {
    const addedDate = addingForDate
    setAddingForDate(null)
    if (addedDate) {
      await refreshAfterChange(addedDate)
    }
  }

  const formatCents = (cents) => {
    return (cents / 100).toFixed(2)
  }

  const getCategoryEmoji = (category) => {
    const categoryLower = category.toLowerCase()
    const emojiMap = {
      food: '🍔', restaurant: '🍽️', coffee: '☕', groceries: '🛒',
      transport: '🚗', uber: '🚕', gas: '⛽', entertainment: '🎬',
      shopping: '🛍️', clothes: '👕', health: '💊', gym: '💪',
      bills: '📄', utilities: '💡', phone: '📱', internet: '📶',
      subscription: '📺', travel: '✈️', hotel: '🏨', education: '📚',
      gifts: '🎁', pet: '🐾', home: '🏠', repair: '🔧', other: '💵',
    }
    for (const [key, emoji] of Object.entries(emojiMap)) {
      if (categoryLower.includes(key)) return emoji
    }
    return '💵'
  }

  const selectedMonthData = availableMonths.find(m => m.value === selectedMonth)

  const monthlyStats = ledgers.reduce((acc, ledger) => {
    acc.totalSpent += ledger.spent_cents
    acc.totalAvailable += ledger.available_cents
    return acc
  }, { totalSpent: 0, totalAvailable: 0 })

  return (
    <div className="history-page">
      {/* Edit Modal */}
      <EditExpenseModal
        isOpen={!!expenseToEdit}
        onClose={() => setExpenseToEdit(null)}
        expense={expenseToEdit}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!expenseToDelete}
        onClose={() => setExpenseToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Expense?"
        message={expenseToDelete ? `Are you sure you want to delete this ${expenseToDelete.category} expense of $${formatCents(expenseToDelete.amount_cents)}?` : ''}
        confirmText="Yes, delete it"
        cancelText="Cancel"
        type="danger"
      />

      {/* Add Expense Modal */}
      <AddExpenseModal
        isOpen={!!addingForDate}
        onClose={() => setAddingForDate(null)}
        date={addingForDate}
        onSuccess={handleAddSuccess}
      />

      <div className="history-header">
        <h1>Spending History</h1>
        <p>Review your past spending and carryover</p>
      </div>

      {/* Month Selector */}
      <div className="filter-card">
        <div className="month-selector-wrapper">
          <label>
            <span className="label-icon">📅</span>
            Select Month
          </label>
          
          <div className="custom-dropdown" ref={dropdownRef}>
            <button 
              className={`dropdown-trigger ${dropdownOpen ? 'open' : ''}`}
              onClick={() => setDropdownOpen(!dropdownOpen)}
              disabled={availableMonths.length === 0}
            >
              <span className="dropdown-value">
                {selectedMonthData?.label || 'Select month'}
                {selectedMonthData?.isCurrentMonth && (
                  <span className="current-badge">Current</span>
                )}
              </span>
              <svg className="dropdown-arrow" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            
            {dropdownOpen && (
              <div className="dropdown-menu">
                {availableMonths.map((month, index) => (
                  <button
                    key={month.value}
                    className={`dropdown-item ${selectedMonth === month.value ? 'selected' : ''}`}
                    onClick={() => handleMonthSelect(month.value)}
                    style={{ '--delay': `${index * 0.02}s` }}
                  >
                    <span className="month-name">{month.label}</span>
                    {month.isCurrentMonth && (
                      <span className="current-badge">Current</span>
                    )}
                    {selectedMonth === month.value && (
                      <svg className="check-icon" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {!loading && ledgers.length > 0 && (
          <div className="monthly-summary">
            <div className="summary-stat">
              <span className="summary-label">Total Spent</span>
              <span className="summary-value spent">${formatCents(monthlyStats.totalSpent)}</span>
            </div>
            <div className="summary-stat">
              <span className="summary-label">Days Tracked</span>
              <span className="summary-value">{ledgers.length}</span>
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="history-loading">
          <div className="loading-spinner"></div>
          <p>Loading history...</p>
        </div>
      )}

      {error && (
        <div className="message message-error">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
          <button onClick={loadData} className="retry-btn">Retry</button>
        </div>
      )}

      {!loading && !error && ledgers.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>No history for this month</p>
          <span>Try selecting a different month</span>
        </div>
      )}

      {!loading && !error && ledgers.length > 0 && (
        <div className="ledger-list">
          {ledgers.map((ledger, index) => (
            <div 
              key={ledger.date} 
              className={`ledger-card ${selectedDate === ledger.date ? 'expanded' : ''}`}
              style={{ '--delay': `${index * 0.03}s` }}
            >
              <div className="ledger-header" onClick={() => handleDateClick(ledger.date)}>
                <div className="ledger-date">
                  <span className="date-day">
                    {new Date(ledger.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <span className="date-full">
                    {new Date(ledger.date + 'T12:00:00').toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="ledger-stats">
                  <div className="stat">
                    <span className="stat-label">Budget</span>
                    <span className="stat-value budget-rate">${formatCents(ledger.daily_rate_cents || 0)}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Available</span>
                    <span className="stat-value">${formatCents(ledger.available_cents)}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Spent</span>
                    <span className="stat-value spent">${formatCents(ledger.spent_cents)}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Carryover</span>
                    <span className={`stat-value ${ledger.carryover_end_cents >= 0 ? 'positive' : 'negative'}`}>
                      ${formatCents(ledger.carryover_end_cents)}
                    </span>
                  </div>
                </div>
                <div className="expand-icon">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              {selectedDate === ledger.date && (
                <div className="ledger-expenses">
                  {!expenses[ledger.date] ? (
                    <div className="expenses-loading">
                      <div className="mini-spinner"></div>
                      Loading expenses...
                    </div>
                  ) : (
                    <>
                      {expenses[ledger.date].length === 0 ? (
                        <div className="no-expenses">
                          <span>🎉</span> No expenses this day
                        </div>
                      ) : (
                        <div className="expenses-list">
                          {expenses[ledger.date].map(expense => (
                            <div 
                              key={expense.id} 
                              className="expense-row clickable"
                              onClick={() => handleExpenseClick(expense)}
                            >
                              <div className="expense-info">
                                <span className="expense-emoji">{getCategoryEmoji(expense.category)}</span>
                                <div className="expense-details">
                                  <span className="expense-category">{expense.category}</span>
                                  {expense.note && <span className="expense-note">{expense.note}</span>}
                                </div>
                              </div>
                              <div className="expense-actions">
                                <span className="expense-amount">${formatCents(expense.amount_cents)}</span>
                                <button 
                                  className="delete-btn"
                                  onClick={(e) => handleDeleteClick(e, expense)}
                                  disabled={deletingId === expense.id}
                                >
                                  {deletingId === expense.id ? (
                                    <div className="mini-spinner"></div>
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
                      
                      {/* Add Expense Button */}
                      <button 
                        className="add-expense-btn"
                        onClick={() => handleAddExpense(ledger.date)}
                      >
                        <svg viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Add Expense for {new Date(ledger.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`
        .history-page {
          animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .history-header {
          margin-bottom: 32px;
        }

        .history-header h1 {
          font-size: 32px;
          font-weight: 800;
          color: white;
          letter-spacing: -1px;
          margin-bottom: 8px;
        }

        .history-header p {
          color: #64748b;
          font-size: 15px;
        }

        .filter-card {
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.8));
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          padding: 20px 24px;
          margin-bottom: 24px;
        }

        .month-selector-wrapper {
          margin-bottom: 0;
        }

        .month-selector-wrapper label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #94a3b8;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 10px;
        }

        .label-icon {
          font-size: 14px;
        }

        .custom-dropdown {
          position: relative;
        }

        .dropdown-trigger {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(16, 185, 129, 0.02));
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 12px;
          color: white;
          font-family: inherit;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
        }

        .dropdown-trigger:hover {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05));
          border-color: rgba(16, 185, 129, 0.4);
        }

        .dropdown-trigger.open {
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }

        .dropdown-value {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .dropdown-arrow {
          width: 20px;
          height: 20px;
          color: #10b981;
          transition: transform 0.3s;
        }

        .dropdown-trigger.open .dropdown-arrow {
          transform: rotate(180deg);
        }

        .current-badge {
          padding: 3px 8px;
          background: rgba(16, 185, 129, 0.15);
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          color: #10b981;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.98));
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 8px;
          max-height: 280px;
          overflow-y: auto;
          z-index: 100;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
          animation: dropdownSlide 0.2s ease-out;
        }

        @keyframes dropdownSlide {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .dropdown-menu::-webkit-scrollbar {
          width: 6px;
        }

        .dropdown-menu::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 3px;
        }

        .dropdown-menu::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.3);
          border-radius: 3px;
        }

        .dropdown-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: #94a3b8;
          font-family: inherit;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          animation: itemFade 0.3s ease-out backwards;
          animation-delay: var(--delay);
        }

        @keyframes itemFade {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .dropdown-item:hover {
          background: rgba(255, 255, 255, 0.05);
          color: white;
        }

        .dropdown-item.selected {
          background: rgba(16, 185, 129, 0.1);
          color: white;
        }

        .dropdown-item .month-name {
          flex: 1;
          text-align: left;
        }

        .check-icon {
          width: 16px;
          height: 16px;
          color: #10b981;
        }

        .monthly-summary {
          display: flex;
          gap: 24px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          margin-top: 16px;
        }

        .summary-stat {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .summary-label {
          color: #64748b;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .summary-value {
          color: white;
          font-size: 20px;
          font-weight: 700;
        }

        .summary-value.spent {
          color: #f87171;
        }

        .history-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          gap: 16px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(16, 185, 129, 0.1);
          border-top-color: #10b981;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .history-loading p {
          color: #64748b;
          font-size: 14px;
        }

        .message {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          border-radius: 12px;
          font-size: 14px;
          margin-bottom: 20px;
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

        .retry-btn {
          margin-left: auto;
          padding: 6px 14px;
          background: rgba(239, 68, 68, 0.2);
          border: none;
          border-radius: 6px;
          color: #f87171;
          font-family: inherit;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .retry-btn:hover {
          background: rgba(239, 68, 68, 0.3);
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 20px;
          text-align: center;
        }

        .empty-icon {
          font-size: 56px;
          margin-bottom: 16px;
        }

        .empty-state p {
          color: white;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .empty-state span {
          color: #64748b;
          font-size: 14px;
        }

        .ledger-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .ledger-card {
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.8));
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          overflow: hidden;
          transition: all 0.3s;
          animation: slideIn 0.4s ease-out backwards;
          animation-delay: var(--delay);
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .ledger-card:hover {
          border-color: rgba(255, 255, 255, 0.1);
        }

        .ledger-card.expanded {
          border-color: rgba(16, 185, 129, 0.3);
        }

        .ledger-header {
          display: flex;
          align-items: center;
          padding: 16px 20px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .ledger-header:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        .ledger-date {
          display: flex;
          flex-direction: column;
          min-width: 80px;
        }

        .date-day {
          color: #10b981;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .date-full {
          color: white;
          font-size: 14px;
          font-weight: 600;
        }

        .ledger-stats {
          display: flex;
          gap: 24px;
          margin-left: auto;
          margin-right: 16px;
        }

        @media (max-width: 700px) {
          .ledger-stats {
            gap: 12px;
          }
          .ledger-header {
            padding: 14px 16px;
          }
          .stat-label {
            display: none;
          }
        }

        .stat {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .stat-label {
          color: #64748b;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-value {
          color: white;
          font-size: 14px;
          font-weight: 700;
        }

        .stat-value.budget-rate {
          color: #60a5fa;
        }

        .stat-value.spent {
          color: #f87171;
        }

        .stat-value.positive {
          color: #10b981;
        }

        .stat-value.negative {
          color: #f87171;
        }

        .expand-icon {
          color: #64748b;
          transition: transform 0.3s;
        }

        .expand-icon svg {
          width: 18px;
          height: 18px;
        }

        .ledger-card.expanded .expand-icon {
          transform: rotate(180deg);
          color: #10b981;
        }

        .ledger-expenses {
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding: 16px 20px;
          background: rgba(0, 0, 0, 0.2);
          animation: expandIn 0.3s ease-out;
        }

        @keyframes expandIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .expenses-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: #64748b;
          font-size: 14px;
          padding: 16px;
        }

        .mini-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(16, 185, 129, 0.1);
          border-top-color: #10b981;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .no-expenses {
          text-align: center;
          color: #64748b;
          font-size: 14px;
          padding: 16px;
        }

        .no-expenses span {
          margin-right: 6px;
        }

        .expenses-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .expense-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.04);
          transition: all 0.2s;
        }

        .expense-row.clickable {
          cursor: pointer;
        }

        .expense-row.clickable:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(59, 130, 246, 0.3);
        }

        .expense-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .expense-emoji {
          font-size: 20px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
        }

        .expense-details {
          display: flex;
          flex-direction: column;
        }

        .expense-category {
          color: white;
          font-weight: 600;
          font-size: 13px;
        }

        .expense-note {
          color: #64748b;
          font-size: 11px;
          margin-top: 1px;
        }

        .expense-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .expense-amount {
          color: #f87171;
          font-weight: 700;
          font-size: 14px;
        }

        .delete-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 8px;
          color: #f87171;
          cursor: pointer;
          transition: all 0.2s;
        }

        .delete-btn:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.2);
          transform: scale(1.05);
        }

        .delete-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .delete-btn svg {
          width: 16px;
          height: 16px;
        }

        .add-expense-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          margin-top: 12px;
          padding: 12px 16px;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05));
          border: 1px dashed rgba(16, 185, 129, 0.3);
          border-radius: 10px;
          color: #10b981;
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .add-expense-btn:hover {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.1));
          border-color: rgba(16, 185, 129, 0.5);
          transform: translateY(-2px);
        }

        .add-expense-btn svg {
          width: 18px;
          height: 18px;
        }
      `}</style>
    </div>
  )
}

// Add Expense Modal Component
function AddExpenseModal({ isOpen, onClose, date, onSuccess }) {
  const [formData, setFormData] = useState({
    amount_cents: '',
    category: '',
    note: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})

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

  useEffect(() => {
    if (isOpen) {
      setFormData({ amount_cents: '', category: '', note: '' })
      setError(null)
      setValidationErrors({})
    }
  }, [isOpen])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setValidationErrors(prev => ({ ...prev, [name]: null }))
    setError(null)
  }

  const handleCategorySelect = (categoryValue) => {
    setFormData(prev => ({ ...prev, category: categoryValue }))
    setValidationErrors(prev => ({ ...prev, category: null }))
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.amount_cents || parseFloat(formData.amount_cents) <= 0) {
      errors.amount_cents = 'Amount must be greater than $0'
    }
    if (!formData.category) {
      errors.category = 'Please select a category'
    }
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) {
      setError('Please correct the errors in the form.')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const amountCents = Math.round(parseFloat(formData.amount_cents) * 100)

      await api.createExpense({
        date: date,
        amount_cents: amountCents,
        category: formData.category,
        note: formData.note || null,
      })

      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const noteCharCount = formData.note.length
  const noteCharLimit = 30

  if (!isOpen) return null

  const formattedDate = date ? new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }) : ''

  return (
    <div className="modal-overlay">
      <div className="modal-content add-expense-modal">
        <div className="modal-header">
          <div>
            <h2>Add Expense</h2>
            <p className="modal-subtitle">{formattedDate}</p>
          </div>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="add_amount">
                <span className="label-icon">💵</span>
                Amount
              </label>
              <div className={`input-with-prefix ${validationErrors.amount_cents ? 'input-error' : ''}`}>
                <span className="input-prefix">$</span>
                <input
                  type="number"
                  id="add_amount"
                  name="amount_cents"
                  value={formData.amount_cents}
                  onChange={handleChange}
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  className="no-spinner"
                />
              </div>
              {validationErrors.amount_cents && (
                <div className="field-error">
                  <span className="error-icon">⚠</span> {validationErrors.amount_cents}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>
                <span className="label-icon">🏷️</span>
                Category
              </label>
              <div className={`category-grid ${validationErrors.category ? 'category-grid-error' : ''}`}>
                {categories.map(cat => (
                  <button
                    key={cat.value}
                    type="button"
                    className={`category-btn ${formData.category === cat.value ? 'active' : ''}`}
                    onClick={() => handleCategorySelect(cat.value)}
                  >
                    <span className="category-emoji">{cat.emoji}</span>
                    <span className="category-label">{cat.label}</span>
                  </button>
                ))}
              </div>
              {validationErrors.category && (
                <div className="field-error">
                  <span className="error-icon">⚠</span> {validationErrors.category}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="add_note">
                <span className="label-icon">📝</span>
                Note <span className="optional">(optional)</span>
                <span className={`char-count ${noteCharCount > (noteCharLimit - 5) ? 'warning' : ''} ${noteCharCount >= noteCharLimit ? 'limit' : ''}`}>
                  {noteCharCount}/{noteCharLimit}
                </span>
              </label>
              <textarea
                id="add_note"
                name="note"
                value={formData.note}
                onChange={handleChange}
                rows="2"
                maxLength={noteCharLimit}
                placeholder="Add details..."
                style={{ resize: 'none' }}
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

            <div className="modal-actions">
              <button type="button" onClick={onClose} className="cancel-btn" disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="save-btn" disabled={loading}>
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
            </div>
          </form>
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
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          animation: fadeInOverlay 0.3s ease-out;
        }

        @keyframes fadeInOverlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content.add-expense-modal {
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9));
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(25px);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
          width: 90%;
          max-width: 420px;
          max-height: calc(100vh - 120px);
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          animation: slideInModal 0.3s ease-out;
        }

        @keyframes slideInModal {
          from { opacity: 0; transform: translateY(50px) scale(0.9); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .modal-header h2 {
          color: white;
          font-size: 20px;
          font-weight: 700;
          margin: 0;
        }

        .modal-subtitle {
          color: #10b981;
          font-size: 13px;
          margin-top: 4px;
        }

        .modal-close-btn {
          background: none;
          border: none;
          font-size: 28px;
          color: #94a3b8;
          cursor: pointer;
          transition: color 0.2s;
          line-height: 1;
        }

        .modal-close-btn:hover {
          color: white;
        }

        .modal-body {
          padding: 24px;
          flex-grow: 1;
          overflow-y: auto;
        }

        .modal-body form {
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
          padding: 12px 14px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          color: white;
          font-family: inherit;
          font-size: 14px;
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

        .form-group textarea {
          resize: none;
          min-height: 60px;
          max-height: 60px;
        }

        .input-with-prefix {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-prefix {
          position: absolute;
          left: 14px;
          color: #64748b;
          font-size: 15px;
          font-weight: 500;
          pointer-events: none;
        }

        .input-with-prefix input {
          padding-left: 34px;
          width: 100%;
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
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .category-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 10px 8px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
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
          box-shadow: 0 0 15px rgba(16, 185, 129, 0.1);
        }

        .category-emoji {
          font-size: 20px;
          transition: transform 0.3s;
        }

        .category-btn:hover .category-emoji {
          transform: scale(1.1);
        }

        .category-label {
          color: #64748b;
          font-size: 11px;
          font-weight: 500;
          text-align: center;
          transition: color 0.3s;
        }

        .category-btn.active .category-label {
          color: #10b981;
        }

        .form-error {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 10px;
          font-size: 13px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #f87171;
          animation: slideIn 0.3s ease-out;
        }

        .form-error svg {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }

        .field-error {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #f87171;
          font-size: 12px;
          margin-top: -4px;
          animation: shake 0.3s ease-in-out;
        }

        .field-error .error-icon {
          font-size: 13px;
        }

        .input-error input {
          border-color: #ef4444 !important;
          box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.1) !important;
        }

        .category-grid-error {
          border: 1px solid #ef4444;
          border-radius: 10px;
          padding: 4px;
          animation: shake 0.3s ease-in-out;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 8px;
        }

        .cancel-btn, .save-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 10px;
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .cancel-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #94a3b8;
        }

        .cancel-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .save-btn {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border: none;
          color: white;
          position: relative;
          overflow: hidden;
        }

        .save-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transform: translateX(-100%);
          transition: transform 0.6s;
        }

        .save-btn:hover:not(:disabled)::before {
          transform: translateX(100%);
        }

        .save-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
        }

        .save-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .save-btn svg {
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
      `}</style>
    </div>
  )
}
