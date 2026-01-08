module AuthenticationHelper
  def authenticate_user(user)
    @authenticated_user = user
    @auth_data = {
      user_id: user.supabase_uid,
      email: user.email,
      exp: Time.now.to_i + 3600
    }
    
    # Stub the service to return auth data for any token
    allow(SupabaseAuthService).to receive(:verify_token).and_return(@auth_data)
  end

  def auth_headers
    { 'Authorization' => 'Bearer test_token' }
  end
end

RSpec.configure do |config|
  config.include AuthenticationHelper, type: :request
  
  # Before each request spec, set up authentication if user is defined
  config.before(:each, type: :request) do |example|
    # This runs before each test
    # If the test calls authenticate_user, it will set up the stub
  end
end

