require 'rails_helper'

RSpec.describe BudgetRate, type: :model do
  describe 'associations' do
    it { should belong_to(:budget) }
  end

  describe 'validations' do
    it { should validate_presence_of(:effective_from) }
    it { should validate_uniqueness_of(:effective_from).scoped_to(:budget_id) }
    it { should validate_presence_of(:base_daily_cents) }
    it { should validate_numericality_of(:base_daily_cents).is_greater_than(0) }
  end

  describe '.rate_for_date' do
    let(:budget) { create(:budget, base_daily_cents: 2000, created_at: 20.days.ago) }
    
    it 'returns the initial budget rate when querying for start_date' do
      # Budget automatically creates an initial rate on creation
      rate = BudgetRate.rate_for_date(budget, budget.start_date)
      expect(rate).to eq(2000)
    end

    it 'returns the most recent rate effective on or before the date' do
      past_date = budget.start_date + 5.days
      recent_date = budget.start_date + 10.days
      
      create(:budget_rate, budget: budget, effective_from: past_date, base_daily_cents: 1500)
      create(:budget_rate, budget: budget, effective_from: recent_date, base_daily_cents: 2500)
      
      # Date before any custom rates (should use initial rate)
      expect(BudgetRate.rate_for_date(budget, budget.start_date)).to eq(2000)
      expect(BudgetRate.rate_for_date(budget, budget.start_date + 2.days)).to eq(2000)
      
      # Date with first custom rate
      expect(BudgetRate.rate_for_date(budget, past_date)).to eq(1500)
      
      # Date between rates
      expect(BudgetRate.rate_for_date(budget, budget.start_date + 7.days)).to eq(1500)
      
      # Date with second rate
      expect(BudgetRate.rate_for_date(budget, recent_date)).to eq(2500)
      
      # Current date
      expect(BudgetRate.rate_for_date(budget, Date.current)).to eq(2500)
    end
  end

  describe 'factory' do
    it 'creates a valid budget rate' do
      rate = build(:budget_rate)
      expect(rate).to be_valid
    end
  end
end

