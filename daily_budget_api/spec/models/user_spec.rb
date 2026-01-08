require 'rails_helper'

RSpec.describe User, type: :model do
  describe 'associations' do
    it { should have_one(:budget).dependent(:destroy) }
    it { should have_many(:subscriptions).dependent(:destroy) }
  end

  describe 'validations' do
    it { should validate_presence_of(:supabase_uid) }
    it { should validate_uniqueness_of(:supabase_uid) }
    it { should validate_presence_of(:email) }
  end

  describe 'factory' do
    it 'creates a valid user' do
      user = build(:user)
      expect(user).to be_valid
    end
  end
end

