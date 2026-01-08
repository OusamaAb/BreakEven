FactoryBot.define do
  factory :expense do
    association :budget
    date { Date.current }
    amount_cents { 1000 } # $10.00
    category { 'food' }
    note { 'Lunch' }
  end
end

