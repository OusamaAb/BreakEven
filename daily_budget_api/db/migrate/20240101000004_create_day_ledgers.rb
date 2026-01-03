class CreateDayLedgers < ActiveRecord::Migration[7.1]
  def change
    create_table :day_ledgers do |t|
      t.references :budget, null: false, foreign_key: true
      t.date :date, null: false
      t.integer :spent_cents, null: false, default: 0
      t.integer :carryover_start_cents, null: false, default: 0
      t.integer :carryover_end_cents, null: false, default: 0
      t.integer :available_cents, null: false, default: 0

      t.timestamps
    end

    add_index :day_ledgers, [:budget_id, :date], unique: true
  end
end

