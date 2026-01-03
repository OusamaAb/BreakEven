class AddCarryoverModeToBudgets < ActiveRecord::Migration[7.1]
  def change
    add_column :budgets, :carryover_mode, :string, default: 'continuous', null: false
  end
end
