require 'rails_helper'

RSpec.describe Budget, type: :model do
  describe 'associations' do
    it { should belong_to(:user) }
    it { should have_many(:expenses).dependent(:destroy) }
    it { should have_many(:day_ledgers).dependent(:destroy) }
    it { should have_many(:budget_rates).dependent(:destroy) }
  end

  describe 'validations' do
    it { should validate_presence_of(:base_daily_cents) }
    it { should validate_numericality_of(:base_daily_cents).is_greater_than(0) }
    it { should validate_presence_of(:currency) }
    it { should validate_presence_of(:timezone) }
    it { should validate_presence_of(:carryover_mode) }
    it { should validate_inclusion_of(:carryover_mode).in_array(%w[continuous monthly_reset]) }
  end

  describe 'callbacks' do
    describe 'after_create' do
      it 'creates an initial budget rate' do
        user = create(:user)
        budget = build(:budget, user: user)
        expect { budget.save! }.to change { BudgetRate.count }.by(1)
        
        rate = budget.budget_rates.first
        expect(rate.effective_from).to eq(budget.start_date)
        expect(rate.base_daily_cents).to eq(budget.base_daily_cents)
      end
    end

    describe 'after_update' do
      context 'when base_daily_cents changes' do
        let(:budget) { create(:budget, created_at: 10.days.ago) }
        
        it 'creates a new budget rate with effective_from set' do
          budget.effective_from = Date.current + 1.day
          expect {
            budget.update!(base_daily_cents: 3000)
          }.to change { BudgetRate.count }.by(1)
          
          new_rate = budget.budget_rates.order(effective_from: :desc).first
          expect(new_rate.base_daily_cents).to eq(3000)
          expect(new_rate.effective_from).to eq(Date.current + 1.day)
        end

        it 'recomputes ledgers when base_daily_cents changes' do
          create(:day_ledger, budget: budget, date: Date.current)
          allow(Ledger::RecomputeFromDate).to receive(:call)
          
          budget.update!(base_daily_cents: 3000)
          
          expect(Ledger::RecomputeFromDate).to have_received(:call).with(
            budget: budget,
            from_date: budget.start_date
          )
        end
      end

      context 'when carryover_mode changes' do
        let(:budget) { create(:budget, created_at: 10.days.ago) }
        
        it 'recomputes all ledgers' do
          create(:day_ledger, budget: budget, date: Date.current)
          allow(Ledger::RecomputeFromDate).to receive(:call)
          
          budget.update!(carryover_mode: 'monthly_reset')
          
          expect(Ledger::RecomputeFromDate).to have_received(:call).with(
            budget: budget,
            from_date: budget.start_date
          )
        end
      end
    end
  end

  describe '#today_in_timezone' do
    it 'returns today in the budget timezone' do
      budget = build(:budget, timezone: 'America/Toronto')
      expected_date = Time.now.in_time_zone('America/Toronto').to_date
      expect(budget.today_in_timezone).to eq(expected_date)
    end
  end

  describe '#start_date' do
    it 'returns the date when the budget was created in timezone' do
      budget = create(:budget)
      expected_date = budget.created_at.in_time_zone(budget.timezone).to_date
      expect(budget.start_date).to eq(expected_date)
    end
  end

  describe '#rate_for_date' do
    it 'returns the rate for a given date' do
      budget = create(:budget, base_daily_cents: 2000, created_at: 10.days.ago)
      date = Date.current
      rate = budget.rate_for_date(date)
      expect(rate).to eq(2000)
    end

    it 'returns the correct historical rate' do
      # Create budget with past start_date so we can test historical rates
      budget = create(:budget, base_daily_cents: 2000, created_at: 10.days.ago)
      past_date = budget.start_date + 5.days
      
      create(:budget_rate, budget: budget, effective_from: past_date, base_daily_cents: 1500)
      
      old_rate = budget.rate_for_date(budget.start_date)
      rate_at_past_date = budget.rate_for_date(past_date)
      current_rate = budget.rate_for_date(Date.current)
      
      expect(old_rate).to eq(2000) # Initial rate
      expect(rate_at_past_date).to eq(1500) # Custom rate
      expect(current_rate).to eq(1500) # Latest rate
    end
  end

  describe 'factory' do
    it 'creates a valid budget' do
      budget = build(:budget)
      expect(budget).to be_valid
    end
  end
end

