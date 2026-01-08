require 'rails_helper'

RSpec.describe 'Api::V1::Expenses', type: :request do
  let(:user) { create(:user) }
  let!(:budget) { create(:budget, user: user, created_at: 10.days.ago) }

  before { authenticate_user(user) }

  describe 'GET /api/v1/expenses' do
    let!(:expense1) { create(:expense, budget: budget, date: Date.current - 2.days) }
    let!(:expense2) { create(:expense, budget: budget, date: Date.current - 1.day) }
    let!(:expense3) { create(:expense, budget: budget, date: Date.current) }

    context 'without date parameters' do
      it 'returns expenses in default date range' do
        get '/api/v1/expenses', headers: auth_headers
        
        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['expenses']).to be_an(Array)
        expect(json['from_date']).to be_present
        expect(json['to_date']).to be_present
      end
    end

    context 'with date parameters' do
      it 'returns expenses in the date range' do
        from_date = Date.current - 2.days
        to_date = Date.current
        
        get '/api/v1/expenses', params: {
          from: from_date.iso8601,
          to: to_date.iso8601
        }, headers: auth_headers
        
        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['expenses'].length).to eq(3)
      end
    end
  end

  describe 'POST /api/v1/expenses' do
    context 'with valid parameters' do
      it 'creates an expense' do
        expect {
          post '/api/v1/expenses', params: {
            date: Date.current.iso8601,
            amount_cents: 1500,
            category: 'food',
            note: 'Lunch'
          }, headers: auth_headers
        }.to change { Expense.count }.by(1)
        
        expect(response).to have_http_status(:created)
        json = JSON.parse(response.body)
        expect(json['amount_cents']).to eq(1500)
        expect(json['category']).to eq('food')
        expect(json['note']).to eq('Lunch')
      end

      it 'recomputes ledgers after creating expense' do
        allow(Ledger::RecomputeFromDate).to receive(:call)
        
        post '/api/v1/expenses', params: {
          date: Date.current.iso8601,
          amount_cents: 1500,
          category: 'food'
        }, headers: auth_headers
        
        expect(Ledger::RecomputeFromDate).to have_received(:call)
      end

      it 'creates a default budget if none exists' do
        budget.destroy
        
        post '/api/v1/expenses', params: {
          date: Date.current.iso8601,
          amount_cents: 1500,
          category: 'food'
        }, headers: auth_headers
        
        expect(response).to have_http_status(:created)
        expect(user.budget).to be_present
      end
    end

    context 'with invalid parameters' do
      it 'returns validation errors' do
        post '/api/v1/expenses', params: {
          amount_cents: -100
        }, headers: auth_headers
        
        expect(response).to have_http_status(:unprocessable_content)
        json = JSON.parse(response.body)
        expect(json['errors']).to be_present
      end
    end
  end

  describe 'PATCH /api/v1/expenses/:id' do
    let!(:expense) { create(:expense, budget: budget) }

    context 'with valid parameters' do
      it 'updates the expense' do
        patch "/api/v1/expenses/#{expense.id}", params: {
          amount_cents: 2000,
          category: 'transportation'
        }, headers: auth_headers
        
        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['amount_cents']).to eq(2000)
        expect(json['category']).to eq('transportation')
        
        expense.reload
        expect(expense.amount_cents).to eq(2000)
      end

      it 'recomputes ledgers after updating expense' do
        allow(Ledger::RecomputeFromDate).to receive(:call)
        
        patch "/api/v1/expenses/#{expense.id}", params: {
          amount_cents: 2000
        }, headers: auth_headers
        
        expect(Ledger::RecomputeFromDate).to have_received(:call)
      end
    end

    context 'when expense does not exist' do
      it 'returns not found' do
        patch '/api/v1/expenses/99999', params: {
          amount_cents: 2000
        }, headers: auth_headers
        
        expect(response).to have_http_status(:not_found)
      end
    end

    context 'when expense belongs to another user' do
      let(:other_user) { create(:user) }
      let!(:other_budget) { create(:budget, user: other_user) }
      let!(:other_expense) { create(:expense, budget: other_budget) }

      it 'returns forbidden' do
        patch "/api/v1/expenses/#{other_expense.id}", params: {
          amount_cents: 2000
        }, headers: auth_headers
        
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe 'DELETE /api/v1/expenses/:id' do
    let!(:expense) { create(:expense, budget: budget) }

    it 'deletes the expense' do
      expect {
        delete "/api/v1/expenses/#{expense.id}", headers: auth_headers
      }.to change { Expense.count }.by(-1)
      
      expect(response).to have_http_status(:no_content)
    end

    it 'recomputes ledgers after deleting expense' do
      allow(Ledger::RecomputeFromDate).to receive(:call)
      
      delete "/api/v1/expenses/#{expense.id}", headers: auth_headers
      
      expect(Ledger::RecomputeFromDate).to have_received(:call)
    end

    context 'when expense does not exist' do
      it 'returns not found' do
        delete '/api/v1/expenses/99999', headers: auth_headers
        
        expect(response).to have_http_status(:not_found)
      end
    end
  end
end

