module Api
  module V1
    class SubscriptionsController < ApplicationController
      before_action :set_subscription, only: [:show, :update, :destroy]

      def index
        subscriptions = current_user.subscriptions.order(next_charge_date: :asc)
        
        render json: {
          subscriptions: subscriptions.map { |s| subscription_json(s) }
        }
      end

      def show
        render json: subscription_json(@subscription)
      end

      def create
        subscription = current_user.subscriptions.build(subscription_params.except(:start_date))
        
        # Calculate next_charge_date from start_date if provided
        if params[:start_date].present?
          start_date = safe_parse_date_param(:start_date)
          return unless start_date # Return early if date parsing failed
          
          if subscription.billing_cycle == 'monthly'
            subscription.next_charge_date = start_date.next_month
          else # yearly
            subscription.next_charge_date = start_date.next_year
          end
        end
        
        if subscription.save
          render json: subscription_json(subscription), status: :created
        else
          render json: { errors: subscription.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        if @subscription.update(subscription_params)
          render json: subscription_json(@subscription)
        else
          render json: { errors: @subscription.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        @subscription.destroy
        head :no_content
      end

      def summary
        budget = current_user.budget || create_default_budget
        
        active_subscriptions = current_user.subscriptions.active
        
        # Calculate total monthly cost (monthly amounts + yearly amounts / 12)
        total_monthly_cents = active_subscriptions.sum(&:monthly_cost_cents)
        
        # Get upcoming subscriptions (within 7 days)
        upcoming_count = active_subscriptions.count { |s| s.charges_soon?(7) }
        
        # Budget comparison (if enabled)
        budget_status = nil
        if budget.subscription_budget_enabled && budget.monthly_subscription_budget_cents
          remaining_cents = budget.monthly_subscription_budget_cents - total_monthly_cents
          over_budget = remaining_cents < 0
          budget_status = {
            enabled: true,
            monthly_budget_cents: budget.monthly_subscription_budget_cents,
            total_monthly_cents: total_monthly_cents,
            remaining_cents: remaining_cents,
            over_budget: over_budget
          }
        else
          budget_status = {
            enabled: false,
            monthly_budget_cents: nil,
            total_monthly_cents: total_monthly_cents,
            remaining_cents: nil,
            over_budget: false
          }
        end

        render json: {
          total_monthly_cents: total_monthly_cents,
          active_count: active_subscriptions.count,
          upcoming_count: upcoming_count,
          budget_status: budget_status
        }
      end

      private

      def set_subscription
        @subscription = current_user.subscriptions.find(params[:id])
      end

      def subscription_params
        params.permit(:name, :amount_cents, :billing_cycle, :category, :status, :next_charge_date, :start_date)
      end

      def subscription_json(subscription)
        {
          id: subscription.id,
          name: subscription.name,
          amount_cents: subscription.amount_cents,
          billing_cycle: subscription.billing_cycle,
          category: subscription.category,
          status: subscription.status,
          next_charge_date: subscription.next_charge_date.iso8601,
          last_charged_date: subscription.last_charged_date&.iso8601,
          monthly_cost_cents: subscription.monthly_cost_cents,
          charges_soon: subscription.charges_soon?(7),
          created_at: subscription.created_at.iso8601,
          updated_at: subscription.updated_at.iso8601
        }
      end

      def create_default_budget
        current_user.create_budget!(
          base_daily_cents: 2000,
          currency: 'CAD',
          timezone: 'America/Toronto'
        )
      end
    end
  end
end

