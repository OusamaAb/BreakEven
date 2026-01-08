require 'rails_helper'

RSpec.describe 'Api::V1::Budget', type: :request do
  let(:user) { create(:user) }

  before { authenticate_user(user) }

  describe 'GET /api/v1/budget' do
    context 'when budget exists' do
      let!(:budget) { create(:budget, user: user, created_at: 10.days.ago) }

      it 'returns the budget' do
        get '/api/v1/budget', headers: auth_headers
        
        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['id']).to eq(budget.id)
        expect(json['base_daily_cents']).to eq(budget.base_daily_cents)
        expect(json['currency']).to eq(budget.currency)
        expect(json['timezone']).to eq(budget.timezone)
      end
    end

    context 'when budget does not exist' do
      it 'creates a default budget' do
        expect {
          get '/api/v1/budget', headers: auth_headers
        }.to change { Budget.count }.by(1)
        
        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['base_daily_cents']).to eq(2000)
        expect(json['currency']).to eq('CAD')
        expect(json['timezone']).to eq('America/Toronto')
      end
    end
  end

  describe 'PATCH /api/v1/budget' do
    let!(:budget) { create(:budget, user: user, base_daily_cents: 2000, created_at: 10.days.ago) }

    context 'with valid parameters' do
      it 'updates the budget' do
        patch '/api/v1/budget', params: {
          base_daily_cents: 3000,
          currency: 'USD',
          timezone: 'America/New_York'
        }, headers: auth_headers
        
        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['base_daily_cents']).to eq(3000)
        expect(json['currency']).to eq('USD')
        expect(json['timezone']).to eq('America/New_York')
      end

      it 'recomputes ledgers when base_daily_cents changes' do
        create(:day_ledger, budget: budget, date: Date.current)
        allow(Ledger::RecomputeFromDate).to receive(:call)
        
        patch '/api/v1/budget', params: { base_daily_cents: 3000 }, headers: auth_headers
        
        expect(Ledger::RecomputeFromDate).to have_received(:call)
      end

      it 'creates a new budget rate when base_daily_cents changes with effective_from' do
        effective_date = Date.current + 1.day
        
        patch '/api/v1/budget', params: {
          base_daily_cents: 3000,
          effective_from: effective_date.iso8601
        }, headers: auth_headers
        
        new_rate = budget.budget_rates.find_by(effective_from: effective_date)
        expect(new_rate).to be_present
        expect(new_rate.base_daily_cents).to eq(3000)
      end
    end

    context 'with invalid parameters' do
      it 'returns validation errors' do
        patch '/api/v1/budget', params: {
          base_daily_cents: -100
        }, headers: auth_headers
        
        expect(response).to have_http_status(:unprocessable_content)
        json = JSON.parse(response.body)
        expect(json['errors']).to be_present
      end
    end
  end
end

