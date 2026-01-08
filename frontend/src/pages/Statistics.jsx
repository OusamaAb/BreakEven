import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../lib/api'

const CATEGORY_OPTIONS = [
  { value: '', label: 'All categories' },
  { value: 'food', label: 'Food' },
  { value: 'transport', label: 'Transport' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'health', label: 'Health' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'rent', label: 'Rent' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'travel', label: 'Travel' },
  { value: 'other', label: 'Other' },
]

const BUCKET_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

const toISO = (date) => date.toISOString().split('T')[0]
const daysAgo = (days) => toISO(new Date(Date.now() - days * 24 * 60 * 60 * 1000))
const formatCurrency = (amount) => `$${amount.toFixed(2)}`
const formatDateLabel = (iso) => {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
const formatBucketLabel = (iso, bucket) => {
  const d = new Date(iso)
  if (bucket === 'monthly') {
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  }
  if (bucket === 'weekly') {
    return `Week of ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  }
  return formatDateLabel(iso)
}

export default function Statistics() {
  const [fromDate, setFromDate] = useState(daysAgo(30))
  const [toDate, setToDate] = useState(toISO(new Date()))
  const [bucket, setBucket] = useState('daily')
  const [category, setCategory] = useState('')
  const [selectedSeries, setSelectedSeries] = useState('all')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!fromDate || !toDate) return
    const start = new Date(fromDate)
    const end = new Date(toDate)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return
    if (start > end) {
      setError('Start date must be before end date')
      return
    }

    const timeout = setTimeout(() => {
      fetchData()
    }, 200)

    return () => clearTimeout(timeout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate, bucket, category])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.getSpendingStats({
        from: fromDate,
        to: toDate,
        bucket,
        category: category || undefined,
      })
      setData(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const chartPoints = useMemo(() => {
    if (!data?.buckets) return []
    return data.buckets.map((b) => ({
      bucket: b.bucket_start,
      total: b.total_cents / 100,
      expenses: b.expense_cents / 100,
      subscriptions: b.subscription_cents / 100,
    }))
  }, [data])

  const categoryBreakdown = useMemo(() => {
    if (!data) return []
    const source = selectedSeries === 'expenses'
      ? data.category_totals_expense
      : selectedSeries === 'subscriptions'
        ? data.category_totals_subscription
        : data.category_totals
    if (!source) return []
    return Object.entries(source).map(([key, value]) => ({
      category: key,
      amount: value / 100,
    }))
  }, [data, selectedSeries])

  const handleSeriesToggle = (value) => {
    setSelectedSeries((prev) => (prev === value ? 'all' : value))
  }

  const handlePreset = (preset) => {
    const now = new Date()
    if (preset === 'thisMonth') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      setFromDate(toISO(start))
      setToDate(toISO(now))
    } else if (preset === 'lastMonth') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 0)
      setFromDate(toISO(start))
      setToDate(toISO(end))
    } else if (preset === 'last90') {
      setFromDate(daysAgo(90))
      setToDate(toISO(now))
    } else {
      setFromDate(daysAgo(30))
      setToDate(toISO(now))
    }
  }

  const totalSpend = (data?.totals?.total_cents || 0) / 100
  const expenseSpend = (data?.totals?.expense_cents || 0) / 100
  const subscriptionSpend = (data?.totals?.subscription_cents || 0) / 100

  return (
    <div className="stats-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Spending Statistics</h1>
          <p className="page-subtitle">Combined view of expenses and subscriptions</p>
        </div>
      </div>

      <div className="stats-filters card">
        <div className="card-body filters-grid">
          <div className="filter-block">
            <div className="filter-block-header">
              <span>Date Range</span>
              <span className="filter-hint">{fromDate} → {toDate}</span>
            </div>
            <div className="filter-row range-row">
              <div className="input-stack">
                <label>From</label>
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </div>
              <span className="filter-separator">→</span>
              <div className="input-stack">
                <label>To</label>
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </div>
            </div>
            <div className="preset-buttons">
              <button onClick={() => handlePreset('last30')}>Last 30 days</button>
              <button onClick={() => handlePreset('thisMonth')}>This month</button>
              <button onClick={() => handlePreset('lastMonth')}>Last month</button>
              <button onClick={() => handlePreset('last90')}>Last 90 days</button>
            </div>
          </div>

          <div className="filter-block">
            <div className="filter-block-header">Filters</div>
            <div className="filter-stack">
              <div className="filter-field">
                <label>Bucket</label>
                <div className="segmented">
                  {BUCKET_OPTIONS.map((b) => (
                    <button
                      key={b.value}
                      type="button"
                      className={bucket === b.value ? 'active' : ''}
                      onClick={() => setBucket(b.value)}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="filter-field">
                <label>Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

        </div>
      </div>

      {error && (
        <div className="toast toast-error">
          <div className="toast-icon">⚠️</div>
          <div className="toast-content">
            <p className="toast-title">Error</p>
            <p className="toast-message">{error}</p>
          </div>
          <button className="toast-close" onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="stats-grid">
        <button
          type="button"
          className={`stat-card stat-primary ${selectedSeries === 'total' ? 'active' : ''}`}
          onClick={() => handleSeriesToggle('total')}
        >
          <div className="stat-icon">💳</div>
          <div className="stat-content">
            <p className="stat-label">Total</p>
            <p className="stat-value">${totalSpend.toFixed(2)}</p>
          </div>
        </button>
        <button
          type="button"
          className={`stat-card stat-success ${selectedSeries === 'expenses' ? 'active' : ''}`}
          onClick={() => handleSeriesToggle('expenses')}
        >
          <div className="stat-icon">🛒</div>
          <div className="stat-content">
            <p className="stat-label">Expenses</p>
            <p className="stat-value">${expenseSpend.toFixed(2)}</p>
          </div>
        </button>
        <button
          type="button"
          className={`stat-card stat-warning ${selectedSeries === 'subscriptions' ? 'active' : ''}`}
          onClick={() => handleSeriesToggle('subscriptions')}
        >
          <div className="stat-icon">📺</div>
          <div className="stat-content">
            <p className="stat-label">Subscriptions</p>
            <p className="stat-value">${subscriptionSpend.toFixed(2)}</p>
          </div>
        </button>
      </div>

      <div className="cards-grid">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Spending Over Time</h2>
          </div>
          <div className="card-body chart-body">
            {loading ? (
              <div className="loading-placeholder">Loading...</div>
            ) : chartPoints.length === 0 ? (
              <div className="loading-placeholder">No data for this range</div>
            ) : (
              <SpendingChart data={chartPoints} bucket={bucket} selectedSeries={selectedSeries} />
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Category Breakdown</h2>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="loading-placeholder">Loading...</div>
            ) : categoryBreakdown.length === 0 ? (
              <div className="loading-placeholder">No categories in this range</div>
            ) : (
              <CategoryBreakdown data={categoryBreakdown} />
            )}
          </div>
        </div>
      </div>

      <style>{`
        .stats-page {
          display: flex;
          flex-direction: column;
          gap: 16px;
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .page-title {
          font-size: 30px;
          font-weight: 800;
          color: white;
          margin-bottom: 6px;
        }

        .page-subtitle {
          color: #94a3b8;
          font-size: 15px;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border: none;
          border-radius: 10px;
          color: white;
          font-family: inherit;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        }

        .stats-filters {
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.82));
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.28);
        }

        .filters-grid {
          display: grid;
          grid-template-columns: 1.8fr 1fr;
          gap: 16px;
          align-items: start;
        }

        .filter-block {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 12px;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
        }

        .filter-block-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #e2e8f0;
          font-weight: 700;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .filter-hint {
          color: #64748b;
          font-weight: 600;
          font-size: 12px;
          text-transform: none;
          letter-spacing: 0;
        }

        .filter-stack {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .filter-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .filter-field label,
        .input-stack label {
          color: #94a3b8;
          font-weight: 600;
          font-size: 13px;
        }

        .filter-row {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 8px;
          align-items: center;
        }

        .range-row {
          align-items: end;
        }

        .input-stack {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .filter-row input[type="date"],
        .filter-block select {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 10px 12px;
          color: white;
          font-family: inherit;
          height: 42px;
        }

        .preset-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .preset-buttons button {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #cbd5e1;
          border-radius: 8px;
          padding: 8px 10px;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
        }

        .preset-buttons button:hover {
          border-color: rgba(16, 185, 129, 0.4);
          color: #e2e8f0;
        }

        .filter-separator {
          color: #475569;
          font-weight: 700;
        }

        .segmented {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 6px;
          background: rgba(255, 255, 255, 0.04);
          padding: 6px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .segmented button {
          border: none;
          background: transparent;
          color: #94a3b8;
          font-weight: 700;
          font-size: 13px;
          padding: 8px 0;
          border-radius: 8px;
          cursor: pointer;
        }

        .segmented button.active {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
          box-shadow: 0 6px 16px rgba(16, 185, 129, 0.18);
        }

        .filter-note {
          color: #64748b;
          font-size: 12px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
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
          cursor: pointer;
          text-align: left;
          width: 100%;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          border-color: rgba(255, 255, 255, 0.2);
          box-shadow: 0 14px 36px rgba(0, 0, 0, 0.32);
        }

        .stat-card.active {
          border-color: rgba(16, 185, 129, 0.6);
          box-shadow: 0 12px 32px rgba(16, 185, 129, 0.2);
        }

        .stat-card:focus-visible {
          outline: 2px solid #10b981;
          outline-offset: 2px;
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

        .stat-primary .stat-icon { background: rgba(16, 185, 129, 0.15); color: #10b981; }
        .stat-success .stat-icon { background: rgba(34, 197, 94, 0.15); color: #22c55e; }
        .stat-warning .stat-icon { background: rgba(251, 191, 36, 0.15); color: #fbbf24; }

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

        .cards-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 14px;
        }

        .chart-body {
          min-height: 320px;
        }

        .loading-placeholder {
          color: #94a3b8;
          text-align: center;
          padding: 40px 0;
        }

        .toast {
          position: fixed;
          top: 86px;
          right: 20px;
          background: rgba(30, 41, 59, 0.95);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: white;
          padding: 12px 14px;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
          display: flex;
          gap: 10px;
          align-items: flex-start;
          max-width: 400px;
        }

        .toast-title {
          font-weight: 700;
          margin-bottom: 4px;
        }

        .toast-message {
          color: #cbd5e1;
          font-size: 14px;
        }

        @media (max-width: 1024px) {
          .cards-grid {
            grid-template-columns: 1fr;
          }
          .filters-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 768px) {
          .filters-grid {
            grid-template-columns: 1fr;
          }
          .filter-row {
            grid-template-columns: 1fr;
          }
          .preset-buttons {
            justify-content: flex-start;
          }
        }
      `}</style>
    </div>
  )
}

function SpendingChart({ data, bucket, selectedSeries }) {
  const showTotal = selectedSeries === 'all' || selectedSeries === 'total'
  const showExpenses = selectedSeries === 'all' || selectedSeries === 'expenses'
  const showSubscriptions = selectedSeries === 'all' || selectedSeries === 'subscriptions'

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="bucket"
            tickFormatter={(label) => formatBucketLabel(label, bucket)}
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            minTickGap={18}
          />
          <YAxis
            tickFormatter={(v) => `$${v.toFixed(0)}`}
            tick={{ fill: '#94a3b8', fontSize: 12 }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload || payload.length === 0) return null
              const total = payload.find((item) => item.dataKey === 'total')?.value || 0
              return (
                <div
                  style={{
                    background: 'rgba(15,23,42,0.95)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10,
                    padding: '10px 12px',
                    color: '#e2e8f0',
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>
                    {formatBucketLabel(label, bucket)}
                  </div>
                  {payload.filter((item) => item.dataKey !== 'total').map((item) => (
                    <div key={item.name} style={{ fontSize: 12, color: '#94a3b8' }}>
                      {item.name}: {formatCurrency(item.value)}
                    </div>
                  ))}
                  {showTotal && (
                    <div style={{ marginTop: 6, fontWeight: 700 }}>
                      Total: {formatCurrency(total)}
                    </div>
                  )}
                </div>
              )
            }}
          />
          <Legend />
          {showExpenses && (
            <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#60a5fa" strokeWidth={2} dot={false} />
          )}
          {showSubscriptions && (
            <Line type="monotone" dataKey="subscriptions" name="Subscriptions" stroke="#fbbf24" strokeWidth={2} dot={false} />
          )}
          {showTotal && (
            <Line type="monotone" dataKey="total" name="Total" stroke="#10b981" strokeWidth={2} dot={false} />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function CategoryBreakdown({ data }) {
  const total = data.reduce((sum, d) => sum + d.amount, 0) || 1

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="category" tick={{ fill: '#94a3b8', fontSize: 12 }} />
          <YAxis tickFormatter={(v) => `$${v.toFixed(0)}`} tick={{ fill: '#94a3b8', fontSize: 12 }} />
          <Tooltip
            formatter={(value) => formatCurrency(value)}
            contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}
          />
          <Bar dataKey="amount" fill="url(#colorBar)" radius={[8, 8, 0, 0]} />
          <defs>
            <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.2}/>
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
