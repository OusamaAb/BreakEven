class CreateBudgets < ActiveRecord::Migration[7.1]
  def change
    create_table :budgets do |t|
      t.references :user, null: false, foreign_key: true
      t.integer :base_daily_cents, null: false, default: 2000
      t.string :currency, null: false, default: 'CAD'
      t.string :timezone, null: false, default: 'America/Toronto'

      t.timestamps
    end
  end
end

