require 'rails_helper'

RSpec.describe 'Api::V1::Stats', type: :request do
  let(:user) { create(:user) }
  let!(:budget) { create(:budget, user: user, created_at: 10.days.ago) }

  before { authenticate_user(user) }

  describe 'GET /api/v1/stats/spending' do
    before do
      budget.reload
      today = budget.today_in_timezone
      create(:expense, budget: budget, date: today - 2.days, amount_cents: 1000, category: 'food')
      create(:expense, budget: budget, date: today - 1.day, amount_cents: 1500, category: 'food')
      create(:expense, budget: budget, date: today, amount_cents: 2000, category: 'transportation')
    end

    it 'returns spending statistics' do
      get '/api/v1/stats/spending', headers: auth_headers
      
      expect(response).to have_http_status(:success)
      json = JSON.parse(response.body)
      expect(json['totals']).to be_present
      expect(json['totals']['total_cents']).to eq(4500)
      expect(json['totals']['expense_cents']).to eq(4500)
      expect(json['buckets']).to be_an(Array)
      expect(json['category_totals']).to be_present
    end

    context 'with date range' do
      it 'returns stats for the specified date range' do
        budget.reload
        # Get the same today date used when creating expenses
        today = budget.today_in_timezone
        from_date = today - 2.days
        to_date = today - 1.day
        
        # Verify expenses exist with expected dates
        expense1 = budget.expenses.find_by(date: from_date)
        expense2 = budget.expenses.find_by(date: to_date)
        expense_today = budget.expenses.find_by(date: today)
        
        expect(expense1).to be_present
        expect(expense2).to be_present
        expect(expense_today).to be_present
        
        get '/api/v1/stats/spending', headers: auth_headers, params: {
          from: from_date.iso8601,
          to: to_date.iso8601
        }
        
        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        
        # Debug: Check what expenses were included
        # The range should only include expenses on from_date and to_date
        # Only expenses in range: expense1 (today - 2.days, 1000) + expense2 (today - 1.day, 1500) = 2500
        expenses_in_range = budget.expenses.where(date: from_date..to_date)
        expect(expenses_in_range.count).to eq(2)
        expect(expenses_in_range.sum(:amount_cents)).to eq(2500)
        
        expect(json['totals']['total_cents']).to eq(2500) # Only expenses in range
      end
    end

    context 'with category filter' do
      it 'returns stats filtered by category' do
        get '/api/v1/stats/spending', headers: auth_headers, params: {
          category: 'food'
        }
        
        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['category']).to eq('food')
        expect(json['totals']['total_cents']).to eq(2500) # Only food expenses
      end
    end

    context 'with bucket parameter' do
      it 'returns stats bucketed by weekly' do
        get '/api/v1/stats/spending', headers: auth_headers, params: {
          bucket: 'weekly'
        }
        
        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['bucket']).to eq('weekly')
      end

      it 'returns stats bucketed by monthly' do
        get '/api/v1/stats/spending', headers: auth_headers, params: {
          bucket: 'monthly'
        }
        
        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['bucket']).to eq('monthly')
      end
    end

    context 'with subscriptions' do
      let!(:subscription) { create(:subscription, user: user, amount_cents: 1999, billing_cycle: 'monthly', status: 'active') }

      it 'includes subscription costs in totals' do
        get '/api/v1/stats/spending', headers: auth_headers, params: {
          from: (Date.current - 30.days).iso8601,
          to: Date.current.iso8601
        }
        
        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['totals']['subscription_cents']).to be > 0
      end
    end
  end
end

