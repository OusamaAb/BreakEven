FactoryBot.define do
  factory :day_ledger do
    association :budget
    date { Date.current }
    spent_cents { 0 }
    carryover_start_cents { 0 }
    carryover_end_cents { 0 }
    available_cents { 2000 }
  end
end

