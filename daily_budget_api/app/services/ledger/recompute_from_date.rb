module Ledger
  # Recomputes day_ledgers from a given date forward to today
  # This ensures correctness when editing past expenses
  # Never computes ledgers before the budget's start_date
  # Uses historical budget rates for each date
  # Respects carryover_mode setting (continuous vs monthly_reset)
  class RecomputeFromDate
    def self.call(budget:, from_date:)
      new(budget: budget, from_date: from_date).call
    end

    def initialize(budget:, from_date:)
      @budget = budget
      @today = budget.today_in_timezone
      @start_date = budget.start_date
      @carryover_mode = budget.carryover_mode
      
      # Never compute before the budget's start date
      @from_date = [from_date.to_date, @start_date].max
      
      # Cache rates for performance
      @rates_cache = {}
    end

    def call
      return if @from_date > @today

      # Process each date from from_date to today in chronological order
      (@from_date..@today).each do |date|
        compute_day_ledger(date)
      end
    end

    private

    def compute_day_ledger(date)
      # Get the rate that was effective on this date
      daily_rate = rate_for_date(date)
      
      # Calculate spent for this date
      spent_cents = @budget.expenses.where(date: date).sum(:amount_cents)

      # Get carryover_start from previous day
      carryover_start_cents = calculate_carryover_start(date)

      # Calculate available and carryover_end using the historical rate
      available_cents = daily_rate + carryover_start_cents
      carryover_end_cents = carryover_start_cents + (daily_rate - spent_cents)

      # Upsert the day_ledger
      @budget.day_ledgers.upsert(
        {
          budget_id: @budget.id,
          date: date,
          spent_cents: spent_cents,
          carryover_start_cents: carryover_start_cents,
          carryover_end_cents: carryover_end_cents,
          available_cents: available_cents,
          updated_at: Time.current
        },
        unique_by: [:budget_id, :date]
      )
    end

    def calculate_carryover_start(date)
      # First day of budget always starts at 0
      return 0 if date == @start_date

      # For monthly_reset mode, reset carryover on first day of each month
      if @carryover_mode == 'monthly_reset' && date.day == 1
        return 0
      end

      # Otherwise, get carryover from previous day
      previous_ledger = @budget.day_ledgers.find_by(date: date - 1.day)
      previous_ledger&.carryover_end_cents || 0
    end

    def rate_for_date(date)
      # Use cached rate if available
      return @rates_cache[date] if @rates_cache.key?(date)
      
      # Look up the rate for this date
      @rates_cache[date] = @budget.rate_for_date(date)
    end
  end
end
