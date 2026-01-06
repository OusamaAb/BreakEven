class User < ApplicationRecord
  has_one :budget, dependent: :destroy
  has_many :expenses, through: :budget
  has_many :subscriptions, dependent: :destroy

  validates :supabase_uid, presence: true, uniqueness: true
  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
end

