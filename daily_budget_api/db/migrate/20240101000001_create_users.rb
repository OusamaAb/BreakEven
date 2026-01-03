class CreateUsers < ActiveRecord::Migration[7.1]
  def change
    create_table :users do |t|
      t.string :supabase_uid, null: false, index: { unique: true }
      t.string :email, null: false

      t.timestamps
    end

    add_index :users, :email
  end
end

