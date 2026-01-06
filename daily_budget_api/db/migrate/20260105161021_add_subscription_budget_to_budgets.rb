class AddSubscriptionBudgetToBudgets < ActiveRecord::Migration[7.1]
  def change
    add_column :budgets, :subscription_budget_enabled, :boolean, default: false, null: false
    add_column :budgets, :monthly_subscription_budget_cents, :integer
  end
end
