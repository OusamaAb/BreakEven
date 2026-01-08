// Import supabase first
import { supabase } from './supabase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

// Get access token from Supabase session
async function getAccessToken() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token
}

// API request wrapper
async function apiRequest(endpoint, options = {}) {
  const token = await getAccessToken()
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    const errorBody = await response.json().catch(() => ({ error: 'Session expired' }))
    // Sign out and redirect to login
    await supabase.auth.signOut()
    window.location.href = '/login'
    throw new Error(errorBody.error || 'Session expired')
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `HTTP error! status: ${response.status}`)
  }

  // Handle empty responses (like DELETE 204 No Content)
  const contentType = response.headers.get('content-type')
  if (response.status === 204 || !contentType || !contentType.includes('application/json')) {
    return { success: true }
  }

  return response.json()
}

// API methods
export const api = {
  // User
  getMe: () => apiRequest('/api/v1/me'),

  // Budget
  getBudget: () => apiRequest('/api/v1/budget'),
  updateBudget: (data) => apiRequest('/api/v1/budget', {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),

  // Daily
  getToday: () => apiRequest('/api/v1/daily/today'),
  getDailyRange: (from, to) => {
    const params = new URLSearchParams({ from, to })
    return apiRequest(`/api/v1/daily?${params}`)
  },

  // Expenses
  getExpenses: (from, to) => {
    const params = new URLSearchParams({ from, to })
    return apiRequest(`/api/v1/expenses?${params}`)
  },
  createExpense: (data) => apiRequest('/api/v1/expenses', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateExpense: (id, data) => apiRequest(`/api/v1/expenses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  deleteExpense: (id) => apiRequest(`/api/v1/expenses/${id}`, {
    method: 'DELETE',
  }),

  // Subscriptions
  getSubscriptions: () => apiRequest('/api/v1/subscriptions'),
  getSubscription: (id) => apiRequest(`/api/v1/subscriptions/${id}`),
  createSubscription: (data) => apiRequest('/api/v1/subscriptions', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateSubscription: (id, data) => apiRequest(`/api/v1/subscriptions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  deleteSubscription: (id) => apiRequest(`/api/v1/subscriptions/${id}`, {
    method: 'DELETE',
  }),
  getSubscriptionSummary: () => apiRequest('/api/v1/subscriptions/summary'),

  // Stats
  getSpendingStats: ({ from, to, bucket = 'daily', category } = {}) => {
    const params = new URLSearchParams()
    if (from) params.append('from', from)
    if (to) params.append('to', to)
    if (bucket) params.append('bucket', bucket)
    if (category) params.append('category', category)

    return apiRequest(`/api/v1/stats/spending?${params.toString()}`)
  },
}
