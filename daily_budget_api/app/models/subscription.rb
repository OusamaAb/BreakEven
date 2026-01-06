class Subscription < ApplicationRecord
  belongs_to :user

  BILLING_CYCLES = %w[monthly yearly].freeze
  STATUSES = %w[active paused].freeze
  CATEGORIES = %w[streaming software music news fitness cloud_storage gaming other].freeze

  validates :name, presence: true
  validates :amount_cents, presence: true, numericality: { greater_than: 0 }
  validates :billing_cycle, presence: true, inclusion: { in: BILLING_CYCLES }
  validates :category, presence: true, inclusion: { in: CATEGORIES }
  validates :status, presence: true, inclusion: { in: STATUSES }
  validates :next_charge_date, presence: true

  scope :active, -> { where(status: 'active') }
  scope :paused, -> { where(status: 'paused') }
  scope :upcoming, ->(days = 7) { where('next_charge_date <= ?', Date.current + days.days) }

  before_save :ensure_next_charge_date_current
  before_validation :set_initial_next_charge_date, on: :create

  # Calculate monthly equivalent cost (for yearly subscriptions, divide by 12)
  def monthly_cost_cents
    return amount_cents if billing_cycle == 'monthly'
    (amount_cents.to_f / 12).ceil
  end

  # Auto-advance next_charge_date if it has passed
  def ensure_next_charge_date_current
    today = Date.current
    
    # If next_charge_date has passed, update last_charged_date and advance next_charge_date
    while next_charge_date <= today
      self.last_charged_date = next_charge_date
      
      if billing_cycle == 'monthly'
        # Advance by 1 month (same day of month)
        self.next_charge_date = next_charge_date.next_month
      else # yearly
        # Advance by 1 year (same month/day)
        self.next_charge_date = next_charge_date.next_year
      end
    end
  end

  # Check if subscription charges within the next N days
  def charges_soon?(days = 7)
    next_charge_date <= Date.current + days.days && next_charge_date >= Date.current
  end

  # Set initial next_charge_date when creating (based on today's date + billing cycle)
  # Note: This is a fallback - the controller should set next_charge_date from start_date
  def set_initial_next_charge_date
    return if next_charge_date.present? # Don't override if explicitly set
    return unless billing_cycle.present? # Wait for billing_cycle to be set
    
    today = Date.current
    
    if billing_cycle == 'monthly'
      self.next_charge_date = today.next_month
    else # yearly
      self.next_charge_date = today.next_year
    end
  end
end

