import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'

// Mock Supabase client
export const mockSupabase = {
  auth: {
    getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    signOut: vi.fn(() => Promise.resolve({ error: null })),
    signInWithOAuth: vi.fn(() => Promise.resolve({ error: null })),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: null },
      unsubscribe: vi.fn()
    }))
  }
}

// Custom render function that includes providers
export function renderWithProviders(ui, options = {}) {
  const { route = '/', ...renderOptions } = options

  window.history.pushState({}, 'Test page', route)

  const Wrapper = ({ children }) => {
    return (
      <BrowserRouter>
        {children}
      </BrowserRouter>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react'

