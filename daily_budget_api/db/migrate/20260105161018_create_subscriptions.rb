class CreateSubscriptions < ActiveRecord::Migration[7.1]
  def change
    create_table :subscriptions do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name, null: false
      t.integer :amount_cents, null: false
      t.string :billing_cycle, null: false
      t.string :category, null: false
      t.string :status, null: false, default: 'active'
      t.date :next_charge_date, null: false
      t.date :last_charged_date

      t.timestamps
    end

    add_index :subscriptions, :status
    add_index :subscriptions, :next_charge_date
  end
end
