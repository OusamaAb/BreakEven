require 'rails_helper'

RSpec.describe 'Api::V1::Subscriptions', type: :request do
  let(:user) { create(:user) }

  before { authenticate_user(user) }

  describe 'GET /api/v1/subscriptions' do
    let!(:subscription1) { create(:subscription, user: user, next_charge_date: Date.current + 1.day) }
    let!(:subscription2) { create(:subscription, user: user, next_charge_date: Date.current + 2.days) }

    it 'returns all subscriptions ordered by next_charge_date' do
      get '/api/v1/subscriptions', headers: auth_headers
      
      expect(response).to have_http_status(:success)
      json = JSON.parse(response.body)
      expect(json['subscriptions']).to be_an(Array)
      expect(json['subscriptions'].length).to eq(2)
      
      # Should be ordered by next_charge_date
      dates = json['subscriptions'].map { |s| Date.parse(s['next_charge_date']) }
      expect(dates).to eq(dates.sort)
    end
  end

  describe 'GET /api/v1/subscriptions/:id' do
    let!(:subscription) { create(:subscription, user: user) }

    it 'returns the subscription' do
      get "/api/v1/subscriptions/#{subscription.id}", headers: auth_headers
      
      expect(response).to have_http_status(:success)
      json = JSON.parse(response.body)
      expect(json['id']).to eq(subscription.id)
      expect(json['name']).to eq(subscription.name)
      expect(json['amount_cents']).to eq(subscription.amount_cents)
    end

    context 'when subscription does not exist' do
      it 'returns not found' do
        get '/api/v1/subscriptions/99999', headers: auth_headers
        
        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe 'POST /api/v1/subscriptions' do
    context 'with valid parameters' do
      it 'creates a subscription' do
        expect {
          post '/api/v1/subscriptions', params: {
            name: 'Netflix',
            amount_cents: 1999,
            billing_cycle: 'monthly',
            category: 'streaming',
            status: 'active'
          }, headers: auth_headers
        }.to change { Subscription.count }.by(1)
        
        expect(response).to have_http_status(:created)
        json = JSON.parse(response.body)
        expect(json['name']).to eq('Netflix')
        expect(json['amount_cents']).to eq(1999)
      end

      it 'calculates next_charge_date from start_date for monthly subscription' do
        start_date = Date.current + 5.days
        
        post '/api/v1/subscriptions', params: {
          name: 'Netflix',
          amount_cents: 1999,
          billing_cycle: 'monthly',
          category: 'streaming',
          status: 'active',
          start_date: start_date.iso8601
        }, headers: auth_headers
        
        expect(response).to have_http_status(:created)
        json = JSON.parse(response.body)
        expect(Date.parse(json['next_charge_date'])).to eq(start_date.next_month)
      end

      it 'calculates next_charge_date from start_date for yearly subscription' do
        start_date = Date.current + 5.days
        
        post '/api/v1/subscriptions', params: {
          name: 'Annual Plan',
          amount_cents: 12000,
          billing_cycle: 'yearly',
          category: 'software',
          status: 'active',
          start_date: start_date.iso8601
        }, headers: auth_headers
        
        expect(response).to have_http_status(:created)
        json = JSON.parse(response.body)
        expect(Date.parse(json['next_charge_date'])).to eq(start_date.next_year)
      end
    end

    context 'with invalid parameters' do
      it 'returns validation errors' do
        post '/api/v1/subscriptions', params: {
          amount_cents: -100
        }, headers: auth_headers
        
        expect(response).to have_http_status(:unprocessable_content)
        json = JSON.parse(response.body)
        expect(json['errors']).to be_present
      end
    end
  end

  describe 'PATCH /api/v1/subscriptions/:id' do
    let!(:subscription) { create(:subscription, user: user) }

    context 'with valid parameters' do
      it 'updates the subscription' do
        patch "/api/v1/subscriptions/#{subscription.id}", params: {
          name: 'Updated Name',
          amount_cents: 2500
        }, headers: auth_headers
        
        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['name']).to eq('Updated Name')
        expect(json['amount_cents']).to eq(2500)
        
        subscription.reload
        expect(subscription.name).to eq('Updated Name')
        expect(subscription.amount_cents).to eq(2500)
      end
    end

    context 'with invalid parameters' do
      it 'returns validation errors' do
        patch "/api/v1/subscriptions/#{subscription.id}", params: {
          amount_cents: -100
        }, headers: auth_headers
        
        expect(response).to have_http_status(:unprocessable_content)
        json = JSON.parse(response.body)
        expect(json['errors']).to be_present
      end
    end
  end

  describe 'DELETE /api/v1/subscriptions/:id' do
    let!(:subscription) { create(:subscription, user: user) }

    it 'deletes the subscription' do
      expect {
        delete "/api/v1/subscriptions/#{subscription.id}", headers: auth_headers
      }.to change { Subscription.count }.by(-1)
      
      expect(response).to have_http_status(:no_content)
    end
  end

  describe 'GET /api/v1/subscriptions/summary' do
    let!(:budget) { create(:budget, user: user, created_at: 10.days.ago) }
    let!(:monthly_sub) { create(:subscription, user: user, billing_cycle: 'monthly', amount_cents: 1000, status: 'active') }
    let!(:yearly_sub) { create(:subscription, user: user, billing_cycle: 'yearly', amount_cents: 12000, status: 'active') }
    let!(:paused_sub) { create(:subscription, user: user, status: 'paused') }

    it 'returns subscription summary' do
      get '/api/v1/subscriptions/summary', headers: auth_headers
      
      expect(response).to have_http_status(:success)
      json = JSON.parse(response.body)
      expect(json['total_monthly_cents']).to eq(2000) # 1000 monthly + 12000/12 yearly
      expect(json['active_count']).to eq(2) # Only active subscriptions
    end

    context 'when subscription budget is enabled' do
      let!(:budget) { create(:budget, user: user, subscription_budget_enabled: true, monthly_subscription_budget_cents: 2500, created_at: 10.days.ago) }

      it 'includes budget status' do
        get '/api/v1/subscriptions/summary', headers: auth_headers
        
        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['budget_status']['enabled']).to be true
        expect(json['budget_status']['monthly_budget_cents']).to eq(2500)
        expect(json['budget_status']['total_monthly_cents']).to eq(2000)
        expect(json['budget_status']['remaining_cents']).to eq(500)
        expect(json['budget_status']['over_budget']).to be false
      end
    end
  end
end

