require 'rails_helper'

RSpec.describe 'Api::V1::Daily', type: :request do
  let(:user) { create(:user) }
  let!(:budget) { create(:budget, user: user, base_daily_cents: 2000, created_at: 10.days.ago) }

  before { authenticate_user(user) }

  describe 'GET /api/v1/daily/today' do
    context 'when ledger exists' do
      let!(:ledger) { create(:day_ledger, budget: budget, date: budget.today_in_timezone) }

      it 'returns today\'s summary' do
        get '/api/v1/daily/today', headers: auth_headers
        
        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['date']).to eq(budget.today_in_timezone.iso8601)
        
        # The endpoint recomputes ledgers, so we should check the recomputed values
        # Reload the ledger to get the updated values after recomputation
        budget.reload
        updated_ledger = budget.day_ledgers.find_by(date: budget.today_in_timezone)
        expect(updated_ledger).to be_present
        expect(json['available_cents']).to eq(updated_ledger.available_cents)
        expect(json['spent_cents']).to eq(updated_ledger.spent_cents)
        expect(json['carryover_start_cents']).to eq(updated_ledger.carryover_start_cents)
        expect(json['carryover_end_cents']).to eq(updated_ledger.carryover_end_cents)
      end
    end

    context 'when ledger does not exist' do
      it 'creates the ledger for today' do
        expect {
          get '/api/v1/daily/today', headers: auth_headers
        }.to change { DayLedger.count }.by_at_least(1)
        
        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['date']).to eq(budget.today_in_timezone.iso8601)
      end
    end

    context 'when gaps exist in ledgers' do
      it 'fills the gaps and recomputes' do
        budget.reload
        gap_date = budget.today_in_timezone - 3.days
        create(:day_ledger, budget: budget, date: gap_date)
        
        # Calculate how many days need to be filled: from gap_date + 1 to today
        days_to_fill = (budget.today_in_timezone - gap_date).to_i
        
        expect {
          get '/api/v1/daily/today', headers: auth_headers
        }.to change { DayLedger.count }.by(days_to_fill)
        
        expect(response).to have_http_status(:success)
      end
    end
  end

  describe 'GET /api/v1/daily' do
    let!(:ledger1) { create(:day_ledger, budget: budget, date: Date.current - 2.days) }
    let!(:ledger2) { create(:day_ledger, budget: budget, date: Date.current - 1.day) }
    let!(:ledger3) { create(:day_ledger, budget: budget, date: Date.current) }

    context 'without date parameters' do
      it 'returns default date range' do
        get '/api/v1/daily', headers: auth_headers
        
        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['ledgers']).to be_an(Array)
        expect(json['from_date']).to be_present
        expect(json['to_date']).to be_present
      end
    end

    context 'with date parameters' do
      it 'returns ledgers in the date range' do
        from_date = Date.current - 2.days
        to_date = Date.current
        
        get '/api/v1/daily', params: {
          from: from_date.iso8601,
          to: to_date.iso8601
        }, headers: auth_headers
        
        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['from_date']).to eq(from_date.iso8601)
        expect(json['to_date']).to eq(to_date.iso8601)
        expect(json['ledgers'].length).to eq(3)
      end
    end

    context 'with dates before start_date' do
      it 'clamps from_date to start_date' do
        from_date = budget.start_date - 5.days
        
        get '/api/v1/daily', params: {
          from: from_date.iso8601,
          to: Date.current.iso8601
        }, headers: auth_headers
        
        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(Date.parse(json['from_date'])).to eq(budget.start_date)
      end
    end
  end
end

