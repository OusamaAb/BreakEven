import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import SubscriptionForm from '../components/SubscriptionForm'
import ConfirmModal from '../components/ConfirmModal'

const CATEGORY_EMOJIS = {
  streaming: '📺',
  software: '💻',
  music: '🎵',
  news: '📰',
  fitness: '💪',
  cloud_storage: '☁️',
  gaming: '🎮',
  other: '💳',
}

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState([])
  const [summary, setSummary] = useState(null)
  const [budget, setBudget] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  
  // Form states
  const [editingSubscription, setEditingSubscription] = useState(null)
  const [subscriptionToDelete, setSubscriptionToDelete] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  
  // Budget settings states
  const [budgetEnabled, setBudgetEnabled] = useState(false)
  const [monthlyBudget, setMonthlyBudget] = useState('')
  const [savingBudget, setSavingBudget] = useState(false)
  const [budgetError, setBudgetError] = useState(null)
  const [budgetSuccess, setBudgetSuccess] = useState(null)
  const [pendingEnable, setPendingEnable] = useState(false)

  useEffect(() => {
    loadData()
  }, [refreshKey])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [subscriptionsData, summaryData, budgetData] = await Promise.all([
        api.getSubscriptions(),
        api.getSubscriptionSummary(),
        api.getBudget()
      ])
      
      setSubscriptions(subscriptionsData.subscriptions || [])
      setSummary(summaryData)
      setBudget(budgetData)
      
      // Set budget form values
      setBudgetEnabled(budgetData.subscription_budget_enabled || false)
      setMonthlyBudget(budgetData.monthly_subscription_budget_cents ? (budgetData.monthly_subscription_budget_cents / 100).toFixed(2) : '')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSuccess = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleEditClick = (subscription) => {
    setEditingSubscription(subscription)
  }

  const handleEditSuccess = () => {
    setEditingSubscription(null)
    setRefreshKey(prev => prev + 1)
  }

  const handleDeleteClick = (subscription) => {
    setSubscriptionToDelete(subscription)
  }

  const handleConfirmDelete = async () => {
    if (!subscriptionToDelete) return
    
    try {
      setDeletingId(subscriptionToDelete.id)
      setSubscriptionToDelete(null)
      await api.deleteSubscription(subscriptionToDelete.id)
      setRefreshKey(prev => prev + 1)
    } catch (err) {
      setError(err.message)
      setTimeout(() => setError(null), 5000)
    } finally {
      setDeletingId(null)
    }
  }

  const handleBudgetToggle = async () => {
    const newEnabled = !budgetEnabled
    setBudgetEnabled(newEnabled)
    setPendingEnable(newEnabled)

    // If turning off, only persist if the budget was actually enabled on the server.
    // If user just toggled on and never saved, skip the API call and reset state quietly.
    if (!newEnabled) {
      const serverEnabled = budget?.subscription_budget_enabled
      if (!serverEnabled) {
        setBudgetSuccess(null)
        setBudgetError(null)
        setPendingEnable(false)
        return
      }

      try {
        setSavingBudget(true)
        setBudgetError(null)
        setBudgetSuccess(null)

        await api.updateBudget({
          subscription_budget_enabled: false,
          monthly_subscription_budget_cents: null,
        })

        setBudgetSuccess('Subscription budget disabled')
        setRefreshKey(prev => prev + 1)
        setTimeout(() => setBudgetSuccess(null), 3000)
      } catch (err) {
        setBudgetError(err.message)
        setBudgetEnabled(true)
        setPendingEnable(true)
      } finally {
        setSavingBudget(false)
      }
    }
  }

  const handleBudgetSave = async (e) => {
    e.preventDefault()
    
    if (!budgetEnabled) return
    
    const amount = parseFloat(monthlyBudget)
    if (!monthlyBudget || isNaN(amount) || amount <= 0) {
      setBudgetError('Please enter a valid monthly budget')
      return
    }
    
    try {
      setSavingBudget(true)
      setBudgetError(null)
      setBudgetSuccess(null)
      
      await api.updateBudget({
        subscription_budget_enabled: pendingEnable,
        monthly_subscription_budget_cents: Math.round(amount * 100),
      })
      
      setBudgetSuccess('Budget updated!')
      setRefreshKey(prev => prev + 1)
      setTimeout(() => setBudgetSuccess(null), 3000)
    } catch (err) {
      setBudgetError(err.message)
    } finally {
      setSavingBudget(false)
    }
  }

  const formatCents = (cents) => {
    return (cents / 100).toFixed(2)
  }

  const formatDate = (dateString) => {
    return new Date(dateString + 'T12:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getDaysUntil = (dateString) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(dateString + 'T12:00:00')
    const diffTime = target - today
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(diffDays, 0)
  }

  const getChargeBadgeLabel = (daysUntil) => {
    if (daysUntil === 0) return 'Charging today'
    if (daysUntil === 1) return 'Charging in 1 day'
    return `Charging in ${daysUntil} days`
  }

  if (loading) {
    return (
      <div className="subscriptions-loading">
        <div className="loading-spinner"></div>
        <p>Loading subscriptions...</p>
        <style>{`
          .subscriptions-loading {
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
          .subscriptions-loading p {
            color: #64748b;
            font-size: 15px;
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="subscriptions-page">
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!subscriptionToDelete}
        onClose={() => setSubscriptionToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Subscription?"
        message={subscriptionToDelete ? `Are you sure you want to delete "${subscriptionToDelete.name}"?` : ''}
        confirmText="Yes, delete it"
        cancelText="Cancel"
        type="danger"
      />

      {/* Edit Modal */}
      {editingSubscription && (
        <SubscriptionForm
          subscription={editingSubscription}
          onSuccess={handleEditSuccess}
          onCancel={() => setEditingSubscription(null)}
          isModal={true}
        />
      )}

      {/* Header Section */}
      <div className="page-header">
        <div className="header-content">
          <div>
            <h1 className="page-title">Subscriptions</h1>
            <p className="page-subtitle">Manage your recurring subscriptions and track spending</p>
          </div>
        </div>
      </div>

      {/* Error Toast */}
      {error && (
        <div className="toast toast-error">
          <div className="toast-icon">⚠️</div>
          <div className="toast-content">
            <p className="toast-title">Error</p>
            <p className="toast-message">{error}</p>
          </div>
          <button className="toast-close" onClick={() => setError(null)}>
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Summary Stats */}
      {summary && (
        <div className="stats-grid">
          <div className="stat-card stat-primary">
            <div className="stat-icon-wrapper">
              <div className="stat-icon">💰</div>
            </div>
            <div className="stat-content">
              <p className="stat-label">Total Monthly</p>
              <p className="stat-value">${formatCents(summary.total_monthly_cents)}</p>
            </div>
          </div>
          <div className="stat-card stat-success">
            <div className="stat-icon-wrapper">
              <div className="stat-icon">✅</div>
            </div>
            <div className="stat-content">
              <p className="stat-label">Active</p>
              <p className="stat-value">{summary.active_count}</p>
            </div>
          </div>
          <div className="stat-card stat-warning">
            <div className="stat-icon-wrapper">
              <div className="stat-icon">🔔</div>
            </div>
            <div className="stat-content">
              <p className="stat-label">Charging Soon</p>
              <p className="stat-value">{summary.upcoming_count}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      {/* Budget on top */}
      <div className="card budget-card-compact">
        <div className="card-header">
          <h2 className="card-title">Subscription Budget</h2>
        </div>
        <div className="card-body">
          <div className="budget-section">
            <div className="budget-toggle-card">
              <div className="toggle-content">
                <h3 className="toggle-title">Monthly Budget Limit</h3>
                <p className="toggle-description">Set a monthly spending limit for all subscriptions</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={budgetEnabled}
                  onChange={handleBudgetToggle}
                  disabled={savingBudget}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            {budgetEnabled && (
              <form onSubmit={handleBudgetSave} className="budget-form">
                <div className="form-field">
                  <label className="form-label">
                    <span className="label-icon">💵</span>
                    Monthly Budget Amount
                  </label>
                  <div className="input-group">
                    <span className="input-prefix">$</span>
                    <input
                      type="number"
                      value={monthlyBudget}
                      onChange={(e) => setMonthlyBudget(e.target.value)}
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      className="input no-spinner"
                      disabled={savingBudget}
                    />
                  </div>
                </div>
                <button type="submit" disabled={savingBudget} className="btn-save">
                  {savingBudget ? (
                    <>
                      <div className="spinner-small"></div>
                      Saving...
                    </>
                  ) : (
                    <>Save</>
                  )}
                </button>
              </form>
            )}

            {budgetError && (
              <div className="alert alert-error">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {budgetError}
              </div>
            )}

            {budgetSuccess && (
              <div className="alert alert-success">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {budgetSuccess}
              </div>
            )}

            {/* Budget Status */}
            {budgetEnabled && summary?.budget_status?.enabled && (
              <div className={`budget-status-card ${summary.budget_status.over_budget ? 'over-budget' : ''}`}>
                <div className="budget-status-header">
                  <h3 className="budget-status-title">Current Budget Status</h3>
                  {summary.budget_status.over_budget && (
                    <span className="badge badge-danger">Over Budget</span>
                  )}
                </div>
                <div className="budget-status-grid">
                  <div className="budget-status-item">
                    <p className="budget-status-label">Monthly Budget</p>
                    <p className="budget-status-value">${formatCents(summary.budget_status.monthly_budget_cents)}</p>
                  </div>
                  <div className="budget-status-item">
                    <p className="budget-status-label">Total Spent</p>
                    <p className="budget-status-value">${formatCents(summary.budget_status.total_monthly_cents)}</p>
                  </div>
                  <div className="budget-status-item">
                    <p className="budget-status-label">Remaining</p>
                    <p className={`budget-status-value ${summary.budget_status.remaining_cents < 0 ? 'negative' : 'positive'}`}>
                      {summary.budget_status.remaining_cents < 0 ? '-' : ''}${formatCents(Math.abs(summary.budget_status.remaining_cents))}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="subscriptions-main-grid">
        <div className="subscriptions-column">
          {/* Add Form (always visible) */}
          <div className="card add-subscription-card">
            <div className="card-header">
              <h2 className="card-title">Add New Subscription</h2>
            </div>
            <div className="card-body">
              <SubscriptionForm
                key="add-subscription-form"
                onSuccess={handleAddSuccess}
              />
            </div>
          </div>
        </div>

        {/* Subscriptions List */}
        <div className="card subscriptions-list-card">
          <div className="card-header">
            <h2 className="card-title">Your Subscriptions</h2>
            {subscriptions.length > 0 && (
              <span className="badge badge-primary">{subscriptions.length}</span>
            )}
          </div>
          <div className="card-body">
            {subscriptions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📺</div>
                <h3 className="empty-title">No subscriptions yet</h3>
                <p className="empty-description">Add your first subscription to start tracking your recurring expenses</p>
              </div>
            ) : (
              <div className="subscriptions-grid">
                {subscriptions.map((subscription) => {
                  const daysUntil = getDaysUntil(subscription.next_charge_date)
                  const isPaused = subscription.status === 'paused'
                  const isUpcoming = subscription.charges_soon && !isPaused
                  const badgeLabel = getChargeBadgeLabel(daysUntil)
                  
                  return (
                    <div
                      key={subscription.id}
                      className={`subscription-card ${isUpcoming ? 'upcoming' : ''} ${isPaused ? 'paused' : ''}`}
                    >
                      <div className="subscription-card-header">
                        <div className="subscription-icon-wrapper">
                          <div className="subscription-icon">
                            {CATEGORY_EMOJIS[subscription.category] || '💳'}
                          </div>
                        </div>
                        <div className="subscription-header-actions">
                          {isUpcoming && (
                            <div className="subscription-badge badge-warning">
                              <svg viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                              {badgeLabel}
                            </div>
                          )}
                          <button
                            onClick={() => handleEditClick(subscription)}
                            className="btn-icon btn-edit"
                            title="Edit subscription"
                          >
                            <svg viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteClick(subscription)
                            }}
                            disabled={deletingId === subscription.id}
                            className="btn-icon btn-delete"
                            title="Delete subscription"
                          >
                            {deletingId === subscription.id ? (
                              <div className="spinner-small"></div>
                            ) : (
                              <svg viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="subscription-card-body">
                        <h3 className="subscription-name">{subscription.name}</h3>
                        <div className="subscription-meta">
                          <span className="subscription-category">{subscription.category.replace('_', ' ')}</span>
                          <span className="meta-separator">•</span>
                          <span className="subscription-cycle">{subscription.billing_cycle}</span>
                          {isPaused && (
                            <>
                              <span className="meta-separator">•</span>
                              <span className="subscription-status-paused">Paused</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="subscription-card-footer">
                        <div className="subscription-amount-primary">
                          <span className="amount-value">${formatCents(subscription.amount_cents)}</span>
                          <span className="amount-period">/{subscription.billing_cycle === 'monthly' ? 'mo' : 'yr'}</span>
                        </div>
                        {subscription.billing_cycle === 'yearly' && (
                          <div className="subscription-amount-secondary">
                            <span className="amount-label">Monthly equivalent:</span>
                            <span className="amount-value-secondary">${formatCents(subscription.monthly_cost_cents)}/mo</span>
                          </div>
                        )}
                        <div className="subscription-next-charge">
                          <svg viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                          Next charge: {formatDate(subscription.next_charge_date)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .subscriptions-page {
          animation: fadeIn 0.3s ease-out;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Loading */
        .subscriptions-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 320px;
          gap: 14px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(16, 185, 129, 0.1);
          border-top-color: #10b981;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .subscriptions-loading p {
          color: #64748b;
          font-size: 14px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Page Header */
        .page-header {
          margin-bottom: 8px;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }

        .page-title {
          font-size: 30px;
          font-weight: 800;
          color: white;
          letter-spacing: -1px;
          margin-bottom: 6px;
        }

        .page-subtitle {
          color: #94a3b8;
          font-size: 15px;
          font-weight: 400;
        }

        /* Buttons */
        .btn-primary {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 18px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border: none;
          border-radius: 10px;
          color: white;
          font-family: inherit;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
        }

        .btn-empty {
          margin-top: 14px;
        }

        /* Toast Notifications */
        .toast {
          position: fixed;
          top: 82px;
          right: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 18px;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.98));
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          backdrop-filter: blur(18px);
          box-shadow: 0 10px 32px rgba(0, 0, 0, 0.35);
          z-index: 1000;
          animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          max-width: 380px;
        }

        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(60%); }
          to { opacity: 1; transform: translateX(0); }
        }

        .toast-error {
          border-color: rgba(239, 68, 68, 0.3);
        }

        .toast-icon {
          font-size: 22px;
          flex-shrink: 0;
        }

        .toast-content {
          flex: 1;
        }

        .toast-title {
          color: white;
          font-weight: 600;
          font-size: 13px;
          margin-bottom: 2px;
        }

        .toast-message {
          color: #94a3b8;
          font-size: 13px;
          line-height: 1.4;
        }

        .toast-close {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          border-radius: 6px;
        }

        .toast-close:hover {
          color: white;
          background: rgba(255, 255, 255, 0.1);
        }

        .toast-close svg {
          width: 16px;
          height: 16px;
        }

        /* Cards */
        .card {
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.8));
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          margin-bottom: 12px;
          overflow: hidden;
          backdrop-filter: blur(18px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.28);
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 18px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          height: 64px;
          box-sizing: border-box;
        }

        .card-title {
          color: white;
          font-size: 18px;
          font-weight: 700;
          margin: 0;
          letter-spacing: -0.3px;
        }

        .card-body {
          padding: 16px 18px;
        }

        .add-subscription-card .card-body {
          padding-top: 12px;
        }

        /* Badges */
        .badge {
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
        }

        .badge-primary {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .badge-warning {
          background: rgba(251, 191, 36, 0.12);
          color: #fbbf24;
          border: 1px solid rgba(251, 191, 36, 0.18);
          gap: 6px;
        }

        .badge-danger {
          background: rgba(239, 68, 68, 0.12);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.18);
        }

        .badge-warning svg {
          width: 14px;
          height: 14px;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          margin-bottom: 8px;
        }

        .stat-card {
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.82));
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          gap: 14px;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.28);
          transition: all 0.25s ease;
        }

        .stat-card:hover {
          border-color: rgba(255, 255, 255, 0.14);
          box-shadow: 0 14px 36px rgba(0, 0, 0, 0.3);
        }

        .stat-icon {
          font-size: 26px;
          width: 46px;
          height: 46px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
        }

        .stat-primary .stat-icon {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }

        .stat-success .stat-icon {
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
        }

        .stat-warning .stat-icon {
          background: rgba(251, 191, 36, 0.15);
          color: #fbbf24;
        }

        .stat-content {
          flex: 1;
        }

        .stat-label {
          color: #94a3b8;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          margin-bottom: 4px;
        }

        .stat-value {
          color: white;
          font-size: 22px;
          font-weight: 700;
        }

        /* Budget */
        .budget-section {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .budget-toggle-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          background: rgba(16, 185, 129, 0.05);
          border: 1px solid rgba(16, 185, 129, 0.12);
          border-radius: 12px;
        }

        .toggle-title {
          color: white;
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .toggle-description {
          color: #94a3b8;
          font-size: 13px;
        }

        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 28px;
          margin-left: 14px;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(255, 255, 255, 0.1);
          transition: 0.25s;
          border-radius: 28px;
        }

        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 22px;
          width: 22px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.25s;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        input:checked + .toggle-slider {
          background: linear-gradient(135deg, #10b981, #059669);
        }

        input:checked + .toggle-slider:before {
          transform: translateX(22px);
        }

        input:disabled + .toggle-slider {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .budget-form {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: flex-end;
          gap: 12px;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-label {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #94a3b8;
          font-size: 13px;
          font-weight: 600;
        }

        .label-icon {
          font-size: 16px;
        }

        .input-group {
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
          z-index: 1;
        }

        .input {
          width: 100%;
          padding: 12px 14px;
          padding-left: 42px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          color: white;
          font-family: inherit;
          font-size: 14px;
          transition: all 0.25s;
        }

        .input:focus {
          outline: none;
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.08);
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.12);
        }

        input[type="number"].no-spinner::-webkit-outer-spin-button,
        input[type="number"].no-spinner::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"].no-spinner {
          -moz-appearance: textfield;
        }

        .btn-save {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 14px;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.4);
          border-radius: 10px;
          color: #10b981;
          font-family: inherit;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          height: 40px;
        }

        .btn-save:hover:not(:disabled) {
          background: rgba(16, 185, 129, 0.18);
        }

        .btn-save:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .alert {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 10px;
          font-size: 13px;
        }

        .alert svg {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }

        .alert-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.18);
          color: #f87171;
        }

        .alert-success {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.18);
          color: #34d399;
        }

        .budget-status-card {
          padding: 14px 16px;
          background: rgba(16, 185, 129, 0.05);
          border: 1px solid rgba(16, 185, 129, 0.12);
          border-radius: 12px;
        }

        .budget-status-card.over-budget {
          background: rgba(239, 68, 68, 0.06);
          border-color: rgba(239, 68, 68, 0.18);
        }

        .budget-status-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .budget-status-title {
          color: white;
          font-size: 15px;
          font-weight: 700;
          margin: 0;
        }

        .budget-status-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
        }

        .budget-status-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .budget-status-label {
          color: #64748b;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .budget-status-value {
          color: white;
          font-size: 18px;
          font-weight: 700;
        }

        .budget-status-value.positive { color: #34d399; }
        .budget-status-value.negative { color: #f87171; }

        /* Empty State */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 16px;
          text-align: center;
        }

        .empty-icon {
          font-size: 60px;
          margin-bottom: 16px;
          opacity: 0.6;
        }

        .empty-title {
          color: white;
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 6px;
        }

        .empty-description {
          color: #94a3b8;
          font-size: 14px;
          margin-bottom: 18px;
          max-width: 360px;
        }

        /* Subscriptions Grid */
        .subscriptions-main-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          align-items: stretch;
        }

        .subscriptions-column {
          display: flex;
          flex-direction: column;
          gap: 12px;
          height: 100%;
        }

        .subscriptions-list-card {
          display: flex;
          flex-direction: column;
        }

        .subscriptions-list-card .card-body {
          flex: 1;
          min-height: 0;
          height: 90vh;
          max-height: 90vh;
          overflow-y: auto;
        }

        .add-subscription-card {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .add-subscription-card .card-body {
          flex: 1;
          min-height: auto;
          height: auto;
          max-height: none;
          overflow: visible;
        }

        .add-subscription-card {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .add-subscription-card .card-body {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        /* Remove extra bottom margin inside the main grid so columns align */
        .subscriptions-main-grid .card {
          margin-bottom: 0;
          height: 100%;
        }

        .subscriptions-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        .subscription-card {
          background: linear-gradient(135deg, rgba(17, 24, 39, 0.78), rgba(30, 41, 59, 0.72));
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 16px;
          transition: all 0.25s ease;
          position: relative;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.24);
        }

        .subscription-card:hover {
          background: linear-gradient(135deg, rgba(17, 24, 39, 0.85), rgba(30, 41, 59, 0.8));
          border-color: rgba(255, 255, 255, 0.14);
          transform: translateY(-2px);
          box-shadow: 0 12px 34px rgba(0, 0, 0, 0.24);
        }

        .subscription-card.upcoming {
          border-color: rgba(251, 191, 36, 0.3);
          background: rgba(251, 191, 36, 0.04);
        }

        .subscription-card.paused {
          opacity: 0.65;
        }

        .subscription-badge {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          z-index: 1;
          margin-right: 4px;
        }

        .subscription-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .subscription-icon {
          font-size: 32px;
          width: 52px;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 12px;
        }

        .subscription-header-actions {
          display: flex;
          gap: 8px;
          align-items: center;
          justify-content: flex-end;
          flex-wrap: wrap;
        }

        .btn-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-icon svg {
          width: 16px;
          height: 16px;
        }

        .btn-icon:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.15);
          color: white;
          transform: translateY(-1px);
        }

        .btn-edit:hover:not(:disabled) {
          background: rgba(16, 185, 129, 0.12);
          border-color: rgba(16, 185, 129, 0.25);
          color: #10b981;
        }

        .btn-delete:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.12);
          border-color: rgba(239, 68, 68, 0.25);
          color: #f87171;
        }

        .subscription-card-body {
          margin-bottom: 12px;
        }

        .subscription-name {
          color: white;
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 6px;
          letter-spacing: -0.2px;
        }

        .subscription-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #94a3b8;
          font-size: 12px;
          flex-wrap: wrap;
        }

        .meta-separator { color: #475569; }
        .subscription-status-paused { color: #fbbf24; font-weight: 600; }

        .subscription-card-footer {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .subscription-amount-primary {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }

        .amount-value {
          color: white;
          font-size: 24px;
          font-weight: 700;
        }

        .amount-period {
          color: #94a3b8;
          font-size: 14px;
          font-weight: 600;
        }

        .subscription-amount-secondary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #64748b;
          font-size: 12px;
        }

        .amount-value-secondary {
          color: #94a3b8;
          font-weight: 600;
        }

        .subscription-next-charge {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #64748b;
          font-size: 12px;
        }

        .subscription-next-charge svg {
          width: 14px;
          height: 14px;
        }

        /* Spinner */
        .spinner-small {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: currentColor;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @media (max-width: 768px) {
          .header-content { flex-direction: column; }
          .page-title { font-size: 24px; }
          .subscriptions-main-grid { grid-template-columns: 1fr; }
          .budget-form { grid-template-columns: 1fr; }
          .subscriptions-grid { grid-template-columns: 1fr; }
          .budget-status-grid { grid-template-columns: 1fr; gap: 10px; }
          .card-body { padding: 14px; }
          .card-header { padding: 14px; }
        }
      `}</style>
    </div>
  )
}
