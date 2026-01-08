FactoryBot.define do
  factory :user do
    sequence(:supabase_uid) { |n| "supabase_uid_#{n}" }
    sequence(:email) { |n| "user#{n}@example.com" }
  end
end

