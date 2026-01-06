Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      get 'me', to: 'me#show'
      get 'budget', to: 'budget#show'
      patch 'budget', to: 'budget#update'
      get 'daily/today', to: 'daily#today'
      get 'daily', to: 'daily#index'
      resources :expenses, only: [:index, :create, :update, :destroy]
      
      resources :subscriptions, only: [:index, :show, :create, :update, :destroy] do
        collection do
          get 'summary', to: 'subscriptions#summary'
        end
      end
    end
  end
end

