require 'rails_helper'

RSpec.describe DayLedger, type: :model do
  describe 'associations' do
    it { should belong_to(:budget) }
  end

  describe 'validations' do
    it { should validate_presence_of(:date) }
    it { should validate_uniqueness_of(:date).scoped_to(:budget_id) }
    it { should validate_presence_of(:spent_cents) }
    it { should validate_numericality_of(:spent_cents).is_greater_than_or_equal_to(0) }
    it { should validate_presence_of(:carryover_start_cents) }
    it { should validate_presence_of(:carryover_end_cents) }
    it { should validate_presence_of(:available_cents) }
    it { should validate_numericality_of(:available_cents).is_greater_than_or_equal_to(0) }
  end

  describe 'factory' do
    it 'creates a valid day ledger' do
      ledger = build(:day_ledger)
      expect(ledger).to be_valid
    end
  end
end

