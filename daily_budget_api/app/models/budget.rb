class Budget < ApplicationRecord
  belongs_to :user
  has_many :expenses, dependent: :destroy
  has_many :day_ledgers, dependent: :destroy
  has_many :budget_rates, dependent: :destroy

  CARRYOVER_MODES = %w[continuous monthly_reset].freeze

  validates :base_daily_cents, presence: true, numericality: { greater_than: 0 }
  validates :currency, presence: true
  validates :timezone, presence: true
  validates :carryover_mode, presence: true, inclusion: { in: CARRYOVER_MODES }

  # Store effective_from date for manual recomputation control
  attr_accessor :effective_from

  after_create :create_initial_rate
  after_update :handle_rate_change, if: :saved_change_to_base_daily_cents?
  after_update :recompute_all_ledgers, if: :saved_change_to_carryover_mode?

  def today_in_timezone
    Time.now.in_time_zone(timezone).to_date
  end

  # The date when the user started using the app
  # No ledgers should be computed before this date
  def start_date
    created_at.in_time_zone(timezone).to_date
  end

  # Get the effective rate for a given date (looks up historical rates)
  def rate_for_date(date)
    BudgetRate.rate_for_date(self, date)
  end

  private

  def create_initial_rate
    # Create the initial rate starting from the budget creation date
    budget_rates.create!(
      effective_from: start_date,
      base_daily_cents: base_daily_cents
    )
  end

  def handle_rate_change
    # Determine the effective date for this rate change
    rate_effective_from = if effective_from.present?
      Date.parse(effective_from.to_s)
    else
      start_date
    end

    # Ensure we don't go before start_date
    rate_effective_from = [rate_effective_from, start_date].max

    if rate_effective_from == start_date
      # If applying to all history, update or replace the initial rate
      # Delete all existing rates and create one from start
      budget_rates.destroy_all
      budget_rates.create!(
        effective_from: start_date,
        base_daily_cents: base_daily_cents
      )
    else
      # Create a new rate effective from the specified date
      # First, check if there's already a rate for this exact date
      existing_rate = budget_rates.find_by(effective_from: rate_effective_from)
      if existing_rate
        existing_rate.update!(base_daily_cents: base_daily_cents)
      else
        budget_rates.create!(
          effective_from: rate_effective_from,
          base_daily_cents: base_daily_cents
        )
      end
    end

    # Recompute ledgers from the effective date forward
    Ledger::RecomputeFromDate.call(budget: self, from_date: rate_effective_from)
  end

  def recompute_all_ledgers
    # When carryover mode changes, recompute all ledgers from start
    Ledger::RecomputeFromDate.call(budget: self, from_date: start_date)
  end
end
