FactoryBot.define do
  factory :budget_rate do
    association :budget
    effective_from { Date.current }
    base_daily_cents { 2000 } # $20.00
  end
end

