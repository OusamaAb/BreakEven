class CreateExpenses < ActiveRecord::Migration[7.1]
  def change
    create_table :expenses do |t|
      t.references :budget, null: false, foreign_key: true
      t.date :date, null: false
      t.integer :amount_cents, null: false
      t.string :category, null: false
      t.text :note

      t.timestamps
    end

    add_index :expenses, [:budget_id, :date]
  end
end

