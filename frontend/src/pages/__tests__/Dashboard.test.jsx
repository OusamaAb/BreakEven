import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../../test/test-utils'
import { within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Dashboard from '../Dashboard'
import { api } from '../../lib/api'

// Mock the API module
vi.mock('../../lib/api', () => ({
  api: {
    getToday: vi.fn(),
    getBudget: vi.fn(),
    getExpenses: vi.fn(),
    deleteExpense: vi.fn(),
    updateExpense: vi.fn(),
  }
}))

// Mock child components
vi.mock('../../components/ExpenseForm', () => ({
  default: ({ onSuccess }) => (
    <div data-testid="expense-form">
      <button onClick={() => onSuccess()}>Mock Submit</button>
    </div>
  )
}))

vi.mock('../../components/ConfirmModal', () => ({
  default: ({ isOpen, onConfirm, onCancel, title }) => 
    isOpen ? (
      <div data-testid="confirm-modal">
        <p>{title}</p>
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    ) : null
}))

vi.mock('../../components/EditExpenseModal', () => ({
  default: ({ isOpen, expense, onSave, onCancel }) =>
    isOpen ? (
      <div data-testid="edit-expense-modal">
        <button onClick={() => onSave({ amount_cents: 2000 })}>Save</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    ) : null
}))

describe('Dashboard', () => {
  const mockTodayData = {
    date: '2024-01-15',
    available_cents: 2000,
    spent_cents: 500,
    carryover_start_cents: 1000,
    carryover_end_cents: 2500,
  }

  const mockBudget = {
    id: 1,
    base_daily_cents: 2000,
    currency: 'CAD',
    timezone: 'America/Toronto',
  }

  const mockExpenses = [
    {
      id: 1,
      date: '2024-01-15',
      amount_cents: 300,
      category: 'food',
      note: 'Lunch',
    },
    {
      id: 2,
      date: '2024-01-15',
      amount_cents: 200,
      category: 'transport',
      note: 'Bus fare',
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    api.getToday.mockResolvedValue(mockTodayData)
    api.getBudget.mockResolvedValue(mockBudget)
    api.getExpenses.mockResolvedValue({ expenses: mockExpenses })
  })

  it('renders loading state initially', () => {
    api.getToday.mockImplementation(() => new Promise(() => {})) // Never resolves
    
    render(<Dashboard />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('displays today\'s summary after loading', async () => {
    render(<Dashboard />)
    
    await waitFor(() => {
      // Verify the stat card labels exist
      expect(screen.getByText(/left to spend/i)).toBeInTheDocument()
      expect(screen.getByText(/spent today/i)).toBeInTheDocument()
      
      // Left to Spend = available_cents - spent_cents = 2000 - 500 = 1500 cents = $15.00
      // Spent = 500 cents = $5.00
      // Use getAllByText since there might be multiple matches, and check at least one exists
      expect(screen.getAllByText(/15\.00/).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/5\.00/).length).toBeGreaterThan(0)
    })
  })

  it('displays expenses list after loading', async () => {
    render(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/lunch/i)).toBeInTheDocument()
      expect(screen.getByText(/bus fare/i)).toBeInTheDocument()
    })
  })

  it('displays error message when API call fails', async () => {
    api.getToday.mockRejectedValue(new Error('Failed to load data'))
    
    render(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/failed to load data/i)).toBeInTheDocument()
    })
  })

  it('refreshes data when expense is created', async () => {
    render(<Dashboard />)
    
    await waitFor(() => {
      expect(api.getToday).toHaveBeenCalledTimes(1)
    })
    
    const mockSubmitButton = screen.getByText(/mock submit/i)
    await userEvent.click(mockSubmitButton)
    
    await waitFor(() => {
      expect(api.getToday).toHaveBeenCalledTimes(2)
    })
  })

  it('opens delete confirmation modal when delete button is clicked', async () => {
    render(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/lunch/i)).toBeInTheDocument()
    })
    
    // Find delete button by title attribute
    const deleteButtons = screen.getAllByTitle(/delete expense/i)
    await userEvent.click(deleteButtons[0])
    
    await waitFor(() => {
      expect(screen.getByTestId('confirm-modal')).toBeInTheDocument()
    })
  })

  it('deletes expense when confirmed', async () => {
    api.deleteExpense.mockResolvedValue({ success: true })
    
    render(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/lunch/i)).toBeInTheDocument()
    })
    
    // Find delete button by title attribute
    const deleteButtons = screen.getAllByTitle(/delete expense/i)
    await userEvent.click(deleteButtons[0])
    
    await waitFor(() => {
      expect(screen.getByTestId('confirm-modal')).toBeInTheDocument()
    })
    
    const confirmButton = screen.getByText(/confirm/i)
    await userEvent.click(confirmButton)
    
    await waitFor(() => {
      expect(api.deleteExpense).toHaveBeenCalledWith(1)
      expect(api.getToday).toHaveBeenCalledTimes(2) // Initial load + refresh
    })
  })

  it('opens edit modal when edit button is clicked', async () => {
    render(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/lunch/i)).toBeInTheDocument()
    })
    
    // Click on the expense item - the entire expense-item div is clickable for editing
    // Clicking on any text within it (like the note) should bubble up to the onClick handler
    const expenseNote = screen.getByText(/lunch/i)
    await userEvent.click(expenseNote)
    
    await waitFor(() => {
      expect(screen.getByTestId('edit-expense-modal')).toBeInTheDocument()
    })
  })

  it('updates expense when saved in edit modal', async () => {
    api.updateExpense.mockResolvedValue({ id: 1, amount_cents: 2000 })
    
    render(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/lunch/i)).toBeInTheDocument()
    })
    
    // Click on the expense item - the entire expense-item div is clickable for editing
    // Clicking on any text within it (like the note) should bubble up to the onClick handler
    const expenseNote = screen.getByText(/lunch/i)
    await userEvent.click(expenseNote)
    
    await waitFor(() => {
      expect(screen.getByTestId('edit-expense-modal')).toBeInTheDocument()
    })
    
    const saveButton = screen.getByText(/save/i)
    await userEvent.click(saveButton)
    
    await waitFor(() => {
      expect(api.updateExpense).toHaveBeenCalledWith(1, { amount_cents: 2000 })
      expect(api.getToday).toHaveBeenCalledTimes(2) // Initial load + refresh
    })
  })

  it('handles empty expenses list', async () => {
    api.getExpenses.mockResolvedValue({ expenses: [] })
    
    render(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.queryByText(/lunch/i)).not.toBeInTheDocument()
      expect(screen.getByText(/no expenses/i)).toBeInTheDocument()
    })
  })
})

