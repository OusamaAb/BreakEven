# Service to verify Supabase JWT tokens
# Proper ES256 signature verification using Supabase JWKS
class SupabaseAuthService
  class InvalidTokenError < StandardError; end

  # Cache JWKS in memory (persists for app lifetime)
  @@jwks_cache = nil
  @@jwks_cache_time = nil
  JWKS_CACHE_DURATION = 1.hour

  def self.verify_token(token)
    new(token).verify
  end

  def self.clear_jwks_cache!
    @@jwks_cache = nil
    @@jwks_cache_time = nil
  end

  def initialize(token)
    @token = token
    @supabase_url = ENV.fetch('SUPABASE_URL')
    @jwt_secret = ENV.fetch('SUPABASE_JWT_SECRET', nil)
  end

  def verify
    # Decode header to get algorithm and key ID
    decoded = JWT.decode(@token, nil, false)
    payload = decoded[0]
    header = decoded[1]
    algorithm = header['alg']
    
    # Verify issuer matches our Supabase project
    expected_issuer = "#{@supabase_url}/auth/v1"
    unless payload['iss'] == expected_issuer
      raise InvalidTokenError, "Invalid issuer"
    end
    
    # Route to appropriate verification method
    if algorithm == 'ES256'
      verify_es256(header['kid'])
    elsif algorithm == 'HS256'
      verify_hs256
    else
      raise InvalidTokenError, "Unsupported algorithm: #{algorithm}"
    end
  rescue JWT::DecodeError => e
    raise InvalidTokenError, "Invalid token: #{e.message}"
  rescue JWT::ExpiredSignature
    raise InvalidTokenError, "Token expired"
  rescue JWT::VerificationError => e
    raise InvalidTokenError, "Signature verification failed: #{e.message}"
  end

  private

  def verify_hs256
    raise InvalidTokenError, "JWT secret not configured" unless @jwt_secret
    
    decoded_token = JWT.decode(@token, @jwt_secret, true, { algorithm: 'HS256' })
    extract_payload(decoded_token[0])
  end

  def verify_es256(kid)
    jwks = fetch_jwks
    
    # Find the key matching the kid from the token header
    key_data = jwks['keys']&.find { |k| k['kid'] == kid }
    raise InvalidTokenError, "No matching key found for kid: #{kid}" unless key_data
    
    # Convert JWK to OpenSSL public key and verify signature
    jwk = JWT::JWK.import(key_data)
    decoded_token = JWT.decode(@token, jwk.public_key, true, { algorithm: 'ES256' })
    
    extract_payload(decoded_token[0])
  end

  def fetch_jwks
    # Return cached JWKS if still valid
    if @@jwks_cache && @@jwks_cache_time && (Time.now - @@jwks_cache_time) < JWKS_CACHE_DURATION
      return @@jwks_cache
    end

    # Correct Supabase JWKS endpoint
    jwks_url = "#{@supabase_url}/auth/v1/.well-known/jwks.json"
    
    require 'net/http'
    require 'json'
    
    uri = URI(jwks_url)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.open_timeout = 5
    http.read_timeout = 5
    
    request = Net::HTTP::Get.new(uri)
    request['Accept'] = 'application/json'
    
    response = http.request(request)
    
    unless response.is_a?(Net::HTTPSuccess)
      raise InvalidTokenError, "Failed to fetch JWKS: HTTP #{response.code}"
    end
    
    jwks = JSON.parse(response.body)
    
    # Validate JWKS structure
    unless jwks['keys'].is_a?(Array) && jwks['keys'].any?
      raise InvalidTokenError, "Invalid JWKS response: no keys found"
    end
    
    # Cache the result
    @@jwks_cache = jwks
    @@jwks_cache_time = Time.now
    
    jwks
  rescue Errno::ECONNREFUSED, Errno::ETIMEDOUT, Net::OpenTimeout, Net::ReadTimeout => e
    raise InvalidTokenError, "Failed to fetch JWKS: #{e.message}"
  rescue OpenSSL::SSL::SSLError => e
    # Retry with relaxed SSL for development (macOS certificate issues)
    retry_fetch_jwks_without_ssl_verify
  end

  def retry_fetch_jwks_without_ssl_verify
    jwks_url = "#{@supabase_url}/auth/v1/.well-known/jwks.json"
    
    uri = URI(jwks_url)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.verify_mode = OpenSSL::SSL::VERIFY_NONE
    http.open_timeout = 5
    http.read_timeout = 5
    
    request = Net::HTTP::Get.new(uri)
    request['Accept'] = 'application/json'
    
    response = http.request(request)
    
    unless response.is_a?(Net::HTTPSuccess)
      raise InvalidTokenError, "Failed to fetch JWKS: HTTP #{response.code}"
    end
    
    jwks = JSON.parse(response.body)
    
    unless jwks['keys'].is_a?(Array) && jwks['keys'].any?
      raise InvalidTokenError, "Invalid JWKS response: no keys found"
    end
    
    @@jwks_cache = jwks
    @@jwks_cache_time = Time.now
    
    jwks
  end

  def extract_payload(payload)
    {
      user_id: payload['sub'],
      email: payload['email'],
      exp: payload['exp']
    }
  end
end
