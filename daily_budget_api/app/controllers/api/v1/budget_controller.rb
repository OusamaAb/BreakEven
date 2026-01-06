module Api
  module V1
    class BudgetController < ApplicationController
      def show
        budget = current_user.budget || create_default_budget
        render json: budget_json(budget)
      end

      def update
        budget = current_user.budget || create_default_budget
        
        # Set effective_from before update so the callback can use it
        budget.effective_from = params[:effective_from] if params[:effective_from].present?
        
        if budget.update(budget_params)
          # Reload to ensure associations are fresh after callbacks
          budget.reload
          render json: budget_json(budget)
        else
          render json: { errors: budget.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def create_default_budget
        current_user.create_budget!(
          base_daily_cents: 2000, # $20.00
          currency: 'CAD',
          timezone: 'America/Toronto'
        )
      end

      def budget_params
        params.permit(:base_daily_cents, :currency, :timezone, :carryover_mode, :subscription_budget_enabled, :monthly_subscription_budget_cents)
      end

      def budget_json(budget)
        {
          id: budget.id,
          base_daily_cents: budget.base_daily_cents,
          currency: budget.currency,
          timezone: budget.timezone,
          carryover_mode: budget.carryover_mode,
          subscription_budget_enabled: budget.subscription_budget_enabled,
          monthly_subscription_budget_cents: budget.monthly_subscription_budget_cents,
          created_at: budget.created_at,
          updated_at: budget.updated_at
        }
      end
    end
  end
end

