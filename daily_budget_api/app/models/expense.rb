class Expense < ApplicationRecord
  belongs_to :budget

  CATEGORIES = %w[food groceries transport entertainment shopping health bills coffee other].freeze

  validates :date, presence: true
  validates :amount_cents, presence: true, numericality: { greater_than: 0 }
  validates :category, presence: true, inclusion: { in: CATEGORIES }

  after_create :recompute_ledger
  after_update :recompute_ledger
  after_destroy :recompute_ledger

  private

  def recompute_ledger
    Ledger::RecomputeFromDate.call(budget: budget, from_date: date)
  end
end

