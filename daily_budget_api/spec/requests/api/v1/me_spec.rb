require 'rails_helper'

RSpec.describe 'Api::V1::Me', type: :request do
  describe 'GET /api/v1/me' do
    let(:user) { create(:user) }

    context 'with valid authentication' do
      before do
        authenticate_user(user)
        # Set up authentication stub
        allow(SupabaseAuthService).to receive(:verify_token).and_return({
          user_id: user.supabase_uid,
          email: user.email,
          exp: Time.now.to_i + 3600
        })
      end

      it 'returns the current user' do
        get '/api/v1/me', headers: { 'Authorization' => 'Bearer test_token' }
        
        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['id']).to eq(user.id)
        expect(json['email']).to eq(user.email)
        expect(json['supabase_uid']).to eq(user.supabase_uid)
      end
    end

    context 'without authentication' do
      it 'returns unauthorized' do
        get '/api/v1/me'
        
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'with invalid token' do
      before do
        allow(SupabaseAuthService).to receive(:verify_token).and_raise(SupabaseAuthService::InvalidTokenError, 'Invalid token')
      end

      it 'returns unauthorized' do
        get '/api/v1/me', headers: { 'Authorization' => 'Bearer invalid_token' }
        
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end

