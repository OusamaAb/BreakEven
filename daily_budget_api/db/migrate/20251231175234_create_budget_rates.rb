class CreateBudgetRates < ActiveRecord::Migration[7.1]
  def change
    create_table :budget_rates do |t|
      t.references :budget, null: false, foreign_key: true
      t.date :effective_from, null: false
      t.integer :base_daily_cents, null: false

      t.timestamps
    end

    add_index :budget_rates, [:budget_id, :effective_from], unique: true
  end
end
