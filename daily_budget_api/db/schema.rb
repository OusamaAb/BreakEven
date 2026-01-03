# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.1].define(version: 2026_01_03_000325) do
  create_schema "auth"
  create_schema "extensions"
  create_schema "graphql"
  create_schema "graphql_public"
  create_schema "pgbouncer"
  create_schema "realtime"
  create_schema "storage"
  create_schema "vault"

  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_graphql"
  enable_extension "pg_stat_statements"
  enable_extension "pgcrypto"
  enable_extension "plpgsql"
  enable_extension "supabase_vault"
  enable_extension "uuid-ossp"

  create_table "budget_rates", force: :cascade do |t|
    t.bigint "budget_id", null: false
    t.date "effective_from", null: false
    t.integer "base_daily_cents", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["budget_id", "effective_from"], name: "index_budget_rates_on_budget_id_and_effective_from", unique: true
    t.index ["budget_id"], name: "index_budget_rates_on_budget_id"
  end

  create_table "budgets", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.integer "base_daily_cents", default: 2000, null: false
    t.string "currency", default: "CAD", null: false
    t.string "timezone", default: "America/Toronto", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "carryover_mode", default: "continuous", null: false
    t.index ["user_id"], name: "index_budgets_on_user_id"
  end

  create_table "day_ledgers", force: :cascade do |t|
    t.bigint "budget_id", null: false
    t.date "date", null: false
    t.integer "spent_cents", default: 0, null: false
    t.integer "carryover_start_cents", default: 0, null: false
    t.integer "carryover_end_cents", default: 0, null: false
    t.integer "available_cents", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["budget_id", "date"], name: "index_day_ledgers_on_budget_id_and_date", unique: true
    t.index ["budget_id"], name: "index_day_ledgers_on_budget_id"
  end

  create_table "expenses", force: :cascade do |t|
    t.bigint "budget_id", null: false
    t.date "date", null: false
    t.integer "amount_cents", null: false
    t.string "category", null: false
    t.text "note"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["budget_id", "date"], name: "index_expenses_on_budget_id_and_date"
    t.index ["budget_id"], name: "index_expenses_on_budget_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "supabase_uid", null: false
    t.string "email", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email"
    t.index ["supabase_uid"], name: "index_users_on_supabase_uid", unique: true
  end

  add_foreign_key "budget_rates", "budgets"
  add_foreign_key "budgets", "users"
  add_foreign_key "day_ledgers", "budgets"
  add_foreign_key "expenses", "budgets"
end
