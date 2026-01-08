FactoryBot.define do
  factory :subscription do
    association :user
    name { 'Netflix' }
    amount_cents { 1999 } # $19.99
    billing_cycle { 'monthly' }
    category { 'streaming' }
    status { 'active' }
    next_charge_date { Date.current.next_month }
    last_charged_date { nil }
  end
end

