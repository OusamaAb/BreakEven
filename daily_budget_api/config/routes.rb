Rails.application.routes.draw do
  # Health check endpoint (no auth required)
  get 'health', to: proc { [200, { 'Content-Type' => 'application/json' }, [{ status: 'ok' }.to_json]] }
  
  # Root endpoint
  root to: proc { [200, { 'Content-Type' => 'application/json' }, [{ message: 'BreakEven API', version: '1.0', endpoints: '/api/v1' }.to_json]] }
  
  namespace :api do
    namespace :v1 do
      get 'me', to: 'me#show'
      get 'budget', to: 'budget#show'
      patch 'budget', to: 'budget#update'
      get 'daily/today', to: 'daily#today'
      get 'daily', to: 'daily#index'
      resources :expenses, only: [:index, :create, :update, :destroy]
      get 'stats/spending', to: 'stats#spending'
      
      resources :subscriptions, only: [:index, :show, :create, :update, :destroy] do
        collection do
          get 'summary', to: 'subscriptions#summary'
        end
      end
    end
  end
end
