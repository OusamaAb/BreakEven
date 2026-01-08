require 'rails_helper'

RSpec.describe Expense, type: :model do
  describe 'associations' do
    it { should belong_to(:budget) }
  end

  describe 'validations' do
    it { should validate_presence_of(:date) }
    it { should validate_presence_of(:amount_cents) }
    it { should validate_numericality_of(:amount_cents).is_greater_than(0) }
    it { should validate_presence_of(:category) }
  end

  describe 'callbacks' do
    let(:budget) { create(:budget) }
    
    describe 'after_create' do
      it 'recomputes ledger from expense date' do
        expense_date = Date.current - 2.days
        allow(Ledger::RecomputeFromDate).to receive(:call)
        
        create(:expense, budget: budget, date: expense_date)
        
        expect(Ledger::RecomputeFromDate).to have_received(:call).with(
          budget: budget,
          from_date: expense_date
        )
      end
    end

    describe 'after_update' do
      it 'recomputes ledger when expense is updated' do
        expense = create(:expense, budget: budget, date: Date.current - 1.day)
        allow(Ledger::RecomputeFromDate).to receive(:call)
        
        expense.update!(amount_cents: 2000)
        
        expect(Ledger::RecomputeFromDate).to have_received(:call).with(
          budget: budget,
          from_date: expense.date
        )
      end
    end

    describe 'after_destroy' do
      it 'recomputes ledger when expense is deleted' do
        expense = create(:expense, budget: budget, date: Date.current - 1.day)
        expense_date = expense.date
        allow(Ledger::RecomputeFromDate).to receive(:call)
        
        expense.destroy
        
        expect(Ledger::RecomputeFromDate).to have_received(:call).with(
          budget: budget,
          from_date: expense_date
        )
      end
    end
  end

  describe 'factory' do
    it 'creates a valid expense' do
      expense = build(:expense)
      expect(expense).to be_valid
    end
  end
end

