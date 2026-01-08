import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../test/test-utils'
import userEvent from '@testing-library/user-event'
import ExpenseForm from '../ExpenseForm'
import { api } from '../../lib/api'

// Mock the API module
vi.mock('../../lib/api', () => ({
  api: {
    createExpense: vi.fn(),
  }
}))

describe('ExpenseForm', () => {
  const mockOnSuccess = vi.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the form fields', () => {
    render(<ExpenseForm onSuccess={mockOnSuccess} />)
    
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/note/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add expense/i })).toBeInTheDocument()
  })

  it('shows validation errors when submitting empty form', async () => {
    render(<ExpenseForm onSuccess={mockOnSuccess} />)
    
    const submitButton = screen.getByRole('button', { name: /add expense/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/please enter an amount/i)).toBeInTheDocument()
      expect(screen.getByText(/please select a category/i)).toBeInTheDocument()
    })
    
    expect(api.createExpense).not.toHaveBeenCalled()
  })

  it('shows validation error for invalid amount', async () => {
    render(<ExpenseForm onSuccess={mockOnSuccess} />)
    
    const amountInput = screen.getByLabelText(/amount/i)
    await user.type(amountInput, '0')
    
    const submitButton = screen.getByRole('button', { name: /add expense/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/amount must be greater than \$0/i)).toBeInTheDocument()
    })
    
    expect(api.createExpense).not.toHaveBeenCalled()
  })

  it('submits the form with valid data', async () => {
    api.createExpense.mockResolvedValue({
      id: 1,
      date: '2024-01-15',
      amount_cents: 1500,
      category: 'food',
      note: 'Test expense'
    })

    render(<ExpenseForm onSuccess={mockOnSuccess} />)
    
    const amountInput = screen.getByLabelText(/amount/i)
    await user.type(amountInput, '15.00')
    
    const categorySelect = screen.getByLabelText(/category/i)
    await user.selectOptions(categorySelect, 'food')
    
    const noteInput = screen.getByLabelText(/note/i)
    await user.type(noteInput, 'Test expense')
    
    const submitButton = screen.getByRole('button', { name: /add expense/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(api.createExpense).toHaveBeenCalledWith({
        date: expect.any(String),
        amount_cents: 1500,
        category: 'food',
        note: 'Test expense'
      })
    })
    
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })

  it('clears the form after successful submission', async () => {
    api.createExpense.mockResolvedValue({
      id: 1,
      date: '2024-01-15',
      amount_cents: 1500,
      category: 'food'
    })

    render(<ExpenseForm onSuccess={mockOnSuccess} />)
    
    const amountInput = screen.getByLabelText(/amount/i)
    await user.type(amountInput, '15.00')
    
    const categorySelect = screen.getByLabelText(/category/i)
    await user.selectOptions(categorySelect, 'food')
    
    const submitButton = screen.getByRole('button', { name: /add expense/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(amountInput.value).toBe('')
      expect(categorySelect.value).toBe('')
    })
  })

  it('shows error message when API call fails', async () => {
    api.createExpense.mockRejectedValue(new Error('API Error'))

    render(<ExpenseForm onSuccess={mockOnSuccess} />)
    
    const amountInput = screen.getByLabelText(/amount/i)
    await user.type(amountInput, '15.00')
    
    const categorySelect = screen.getByLabelText(/category/i)
    await user.selectOptions(categorySelect, 'food')
    
    const submitButton = screen.getByRole('button', { name: /add expense/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/api error/i)).toBeInTheDocument()
    })
    
    expect(mockOnSuccess).not.toHaveBeenCalled()
  })

  it('uses defaultDate when provided', () => {
    const defaultDate = '2024-01-15'
    render(<ExpenseForm defaultDate={defaultDate} onSuccess={mockOnSuccess} />)
    
    const dateInput = screen.getByLabelText(/date/i)
    expect(dateInput.value).toBe(defaultDate)
  })
})

