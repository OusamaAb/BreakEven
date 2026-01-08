require 'rails_helper'

RSpec.describe Ledger::RecomputeFromDate, type: :service do
  let(:user) { create(:user) }
  let(:budget) { create(:budget, user: user, base_daily_cents: 2000, created_at: 5.days.ago) }
  
  describe '.call' do
    context 'with no expenses' do
      it 'creates ledgers with zero spent and proper carryover' do
        budget.reload # Ensure associations are fresh
        first_date = budget.start_date + 1.day
        second_date = budget.start_date + 2.days
        
        # Service computes from first_date all the way to today
        Ledger::RecomputeFromDate.call(budget: budget, from_date: first_date)
        
        budget.reload # Reload to get fresh ledgers
        
        # Check first day (should start with 0 carryover)
        first_ledger = budget.day_ledgers.find_by(date: first_date)
        expect(first_ledger).to be_present
        expect(first_ledger.spent_cents).to eq(0)
        expect(first_ledger.carryover_start_cents).to eq(0)
        expect(first_ledger.available_cents).to eq(2000) # base_daily_cents
        expect(first_ledger.carryover_end_cents).to eq(2000) # unspent amount
        
        # Check second day (should carryover from first day)
        second_ledger = budget.day_ledgers.find_by(date: second_date)
        expect(second_ledger).to be_present
        expect(second_ledger.spent_cents).to eq(0)
        expect(second_ledger.carryover_start_cents).to eq(2000) # from previous day
        expect(second_ledger.available_cents).to eq(4000) # base + carryover
        expect(second_ledger.carryover_end_cents).to eq(4000) # unspent amount
        
        # Check today - service computes all days from first_date to today
        # Today's carryover_start should be carryover_end from yesterday
        today_date = budget.today_in_timezone
        today_ledger = budget.day_ledgers.find_by(date: today_date)
        expect(today_ledger).to be_present
        # Calculate expected carryover: previous day's carryover_end
        previous_ledger = budget.day_ledgers.find_by(date: today_date - 1.day)
        expect(previous_ledger).to be_present
        expect(today_ledger.carryover_start_cents).to eq(previous_ledger.carryover_end_cents)
        expect(today_ledger.available_cents).to eq(2000 + previous_ledger.carryover_end_cents)
      end
    end

    context 'with expenses' do
      it 'calculates spent amount correctly' do
        budget.reload
        expense_date = budget.start_date + 1.day
        create(:expense, budget: budget, date: expense_date, amount_cents: 1500)
        
        Ledger::RecomputeFromDate.call(budget: budget, from_date: expense_date)
        
        budget.reload
        ledger = budget.day_ledgers.find_by(date: expense_date)
        expect(ledger).to be_present
        expect(ledger.spent_cents).to eq(1500)
        expect(ledger.available_cents).to eq(2000) # base_daily_cents
        expect(ledger.carryover_end_cents).to eq(500) # available - spent
      end

      it 'handles overspending (negative carryover)' do
        budget.reload
        expense_date = budget.start_date + 1.day
        create(:expense, budget: budget, date: expense_date, amount_cents: 2500)
        
        Ledger::RecomputeFromDate.call(budget: budget, from_date: expense_date)
        
        budget.reload
        ledger = budget.day_ledgers.find_by(date: expense_date)
        expect(ledger.spent_cents).to eq(2500)
        expect(ledger.available_cents).to eq(2000)
        expect(ledger.carryover_end_cents).to eq(-500) # negative carryover
        
        # Next day should start with negative carryover
        next_day_date = expense_date + 1.day
        next_day = budget.day_ledgers.find_by(date: next_day_date)
        expect(next_day).to be_present
        expect(next_day.carryover_start_cents).to eq(-500)
        expect(next_day.available_cents).to eq(1500) # base_daily_cents - carryover debt
      end

      it 'carries forward unspent amount to next day' do
        budget.reload
        first_date = budget.start_date + 1.day
        second_date = budget.start_date + 2.days
        
        create(:expense, budget: budget, date: first_date, amount_cents: 500)
        create(:expense, budget: budget, date: second_date, amount_cents: 1000)
        
        Ledger::RecomputeFromDate.call(budget: budget, from_date: first_date)
        
        budget.reload
        first_ledger = budget.day_ledgers.find_by(date: first_date)
        expect(first_ledger).to be_present
        expect(first_ledger.carryover_end_cents).to eq(1500) # 2000 - 500
        
        second_ledger = budget.day_ledgers.find_by(date: second_date)
        expect(second_ledger).to be_present
        expect(second_ledger.carryover_start_cents).to eq(1500) # from first day
        expect(second_ledger.available_cents).to eq(3500) # 2000 + 1500
        expect(second_ledger.carryover_end_cents).to eq(2500) # 3500 - 1000
      end
    end

    context 'with historical budget rates' do
      it 'uses the correct rate for each date' do
        budget.reload
        # Delete the initial rate so we can test custom rates
        budget.budget_rates.destroy_all
        
        old_date = budget.start_date + 1.day
        new_date = budget.start_date + 5.days
        
        create(:budget_rate, budget: budget, effective_from: budget.start_date, base_daily_cents: 2000) # Initial rate
        create(:budget_rate, budget: budget, effective_from: old_date, base_daily_cents: 1500)
        create(:budget_rate, budget: budget, effective_from: new_date, base_daily_cents: 2500)
        
        Ledger::RecomputeFromDate.call(budget: budget, from_date: budget.start_date)
        
        budget.reload
        # Check first day uses initial rate
        start_ledger = budget.day_ledgers.find_by(date: budget.start_date)
        expect(start_ledger).to be_present
        expect(start_ledger.available_cents).to eq(2000) # initial rate
        
        # Check old_date uses old rate
        old_ledger = budget.day_ledgers.find_by(date: old_date)
        expect(old_ledger).to be_present
        # Available should be old rate (1500) + carryover from previous day
        previous_ledger = budget.day_ledgers.find_by(date: old_date - 1.day)
        expected_carryover = previous_ledger&.carryover_end_cents || 0
        expect(old_ledger.carryover_start_cents).to eq(expected_carryover)
        # Verify it's using the old rate (1500)
        daily_rate = budget.rate_for_date(old_date)
        expect(daily_rate).to eq(1500) # old rate
        
        # Check new_date uses new rate
        new_ledger = budget.day_ledgers.find_by(date: new_date)
        expect(new_ledger).to be_present
        # The available will include carryover from previous days
        # Check that the base rate is 2500 (new rate)
        daily_rate = budget.rate_for_date(new_date)
        expect(daily_rate).to eq(2500) # new rate
        # Verify it's using the new rate: available = base_rate + carryover
        # Available should be at least the new rate (2500), plus any carryover
        expect(new_ledger.available_cents).to be >= 2500
        # Calculate expected: base rate (2500) + carryover from previous day
        previous_ledger = budget.day_ledgers.find_by(date: new_date - 1.day)
        expected_available = 2500 + previous_ledger.carryover_end_cents
        expect(new_ledger.available_cents).to eq(expected_available)
      end
    end

    context 'with monthly_reset carryover mode' do
      let(:budget) { create(:budget, user: user, base_daily_cents: 2000, carryover_mode: 'monthly_reset', created_at: 5.days.ago) }
      
      it 'resets carryover on the first day of each month' do
        budget.reload
        # Create budget with start_date on the last day of previous month
        last_day_prev_month = Date.new(Date.current.year, Date.current.month, 1) - 1.day
        budget.update_column(:created_at, last_day_prev_month.beginning_of_day)
        budget.reload
        
        # Set dates across month boundary
        first_day_month = last_day_prev_month + 1.day
        
        # Compute from just the last day of previous month
        # Service will compute from compute_from to today, but we only care about month boundary
        compute_from = [budget.start_date, last_day_prev_month].max
        
        create(:expense, budget: budget, date: last_day_prev_month, amount_cents: 500)
        
        Ledger::RecomputeFromDate.call(budget: budget, from_date: compute_from)
        
        budget.reload
        last_day_ledger = budget.day_ledgers.find_by(date: last_day_prev_month)
        expect(last_day_ledger).to be_present
        # Last day should have: available = base_rate + carryover_start, carryover_end = carryover_start + (rate - spent)
        # If carryover_start is 0 (first day), then: available = 2000, carryover_end = 0 + (2000 - 500) = 1500
        expect(last_day_ledger.carryover_end_cents).to eq(1500) # 2000 - 500
        
        first_day_ledger = budget.day_ledgers.find_by(date: first_day_month)
        expect(first_day_ledger).to be_present
        expect(first_day_ledger.carryover_start_cents).to eq(0) # reset on first of month
        expect(first_day_ledger.available_cents).to eq(2000) # base_daily_cents only
      end
    end

    context 'with date before budget start_date' do
      it 'only computes from start_date forward' do
        budget.reload
        before_start = budget.start_date - 5.days
        from_start = budget.start_date
        
        Ledger::RecomputeFromDate.call(budget: budget, from_date: before_start)
        
        budget.reload
        # Should not create ledger before start_date
        expect(budget.day_ledgers.where('date < ?', from_start).count).to eq(0)
        
        # Should create ledger from start_date
        expect(budget.day_ledgers.find_by(date: from_start)).to be_present
      end
    end

    context 'when recomputing from a past date' do
      it 'recomputes all dates forward to today' do
        budget.reload
        past_date = budget.start_date + 2.days
        
        # Create initial expenses
        create(:expense, budget: budget, date: past_date, amount_cents: 1000)
        
        # Compute initial ledgers
        Ledger::RecomputeFromDate.call(budget: budget, from_date: past_date)
        
        budget.reload
        initial_ledger = budget.day_ledgers.find_by(date: past_date)
        expect(initial_ledger).to be_present
        initial_carryover = initial_ledger.carryover_end_cents
        
        # Update expense (simulating edit)
        expense = budget.expenses.first
        expense.update!(amount_cents: 1500)
        
        # Recompute ledgers after expense update
        Ledger::RecomputeFromDate.call(budget: budget, from_date: past_date)
        
        budget.reload
        # Ledger should be recomputed
        updated_ledger = budget.day_ledgers.find_by(date: past_date)
        expect(updated_ledger).to be_present
        expect(updated_ledger.carryover_end_cents).not_to eq(initial_carryover)
        expect(updated_ledger.carryover_end_cents).to eq(500) # 2000 - 1500
        
        # Subsequent days should also be updated
        next_ledger = budget.day_ledgers.find_by(date: past_date + 1.day)
        expect(next_ledger).to be_present
        expect(next_ledger.carryover_start_cents).to eq(500) # updated carryover
      end
    end

    context 'when from_date is in the future' do
      it 'does not create any ledgers' do
        future_date = Date.current + 5.days
        
        expect {
          Ledger::RecomputeFromDate.call(budget: budget, from_date: future_date)
        }.not_to change { budget.day_ledgers.count }
      end
    end
  end
end

