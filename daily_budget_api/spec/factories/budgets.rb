FactoryBot.define do
  factory :budget do
    association :user
    base_daily_cents { 2000 } # $20.00
    currency { 'CAD' }
    timezone { 'America/Toronto' }
    carryover_mode { 'continuous' }
    subscription_budget_enabled { false }
    monthly_subscription_budget_cents { nil }
  end
end

