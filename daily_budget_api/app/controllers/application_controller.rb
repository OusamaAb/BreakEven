class ApplicationController < ActionController::API
  include DateParsing
  
  # Disable parameter wrapping for API - we expect flat params
  wrap_parameters false
  before_action :authenticate!

  private

  def authenticate!
    token = extract_token_from_header
    return render_unauthorized('Missing token') unless token

    auth_data = SupabaseAuthService.verify_token(token)
    @current_user = find_or_create_user(auth_data)
  rescue SupabaseAuthService::InvalidTokenError => e
    render_unauthorized(e.message)
  end

  def current_user
    @current_user
  end

  def extract_token_from_header
    auth_header = request.headers['Authorization']
    return nil unless auth_header&.start_with?('Bearer ')
    
    auth_header.split(' ').last
  end

  def find_or_create_user(auth_data)
    user = User.find_or_initialize_by(supabase_uid: auth_data[:user_id])
    user.email = auth_data[:email] if user.new_record? || user.email != auth_data[:email]
    user.save!
    user
  end

  def render_unauthorized(message = 'Unauthorized')
    render json: { error: message }, status: :unauthorized
  end
end

