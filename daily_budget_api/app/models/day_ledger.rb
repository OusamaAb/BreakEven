class DayLedger < ApplicationRecord
  belongs_to :budget

  validates :date, presence: true, uniqueness: { scope: :budget_id }
  validates :spent_cents, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :carryover_start_cents, presence: true
  validates :carryover_end_cents, presence: true
  validates :available_cents, presence: true, numericality: { greater_than_or_equal_to: 0 }
end

