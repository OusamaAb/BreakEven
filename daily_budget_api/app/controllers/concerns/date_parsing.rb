module DateParsing
  extend ActiveSupport::Concern

  private

  # Safely parse an ISO8601 date string
  # Prevents ReDoS and invalid date attacks
  def safe_parse_date(date_string)
    return nil unless date_string.present?
    
    # Only allow ISO8601 format (YYYY-MM-DD)
    # This prevents ReDoS attacks from malformed date strings
    unless date_string.match?(/\A\d{4}-\d{2}-\d{2}\z/)
      raise ArgumentError, "Invalid date format. Expected YYYY-MM-DD"
    end
    
    Date.iso8601(date_string)
  rescue ArgumentError, Date::Error => e
    raise ArgumentError, "Invalid date: #{e.message}"
  end

  # Safely parse a date parameter with fallback
  def safe_parse_date_param(param_name, fallback: nil)
    return fallback unless params[param_name].present?
    safe_parse_date(params[param_name])
  rescue ArgumentError => e
    render json: { error: e.message }, status: :bad_request
    nil
  end
end

