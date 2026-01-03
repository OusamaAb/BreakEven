class BudgetRate < ApplicationRecord
  belongs_to :budget

  validates :effective_from, presence: true, uniqueness: { scope: :budget_id }
  validates :base_daily_cents, presence: true, numericality: { greater_than: 0 }

  # Get the rate that was effective on a given date
  def self.rate_for_date(budget, date)
    # Find the most recent rate that was effective on or before the given date
    where(budget: budget)
      .where('effective_from <= ?', date)
      .order(effective_from: :desc)
      .first
      &.base_daily_cents || budget.base_daily_cents
  end
end

