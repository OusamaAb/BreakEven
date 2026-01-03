module Api
  module V1
    class DailyController < ApplicationController
      def today
        budget = current_user.budget || create_default_budget

        today_date = budget.today_in_timezone
        
        # Find the last computed ledger date to ensure we compute all missing days
        # This handles new days automatically (e.g., when user logs in after midnight)
        last_ledger_date = budget.day_ledgers.maximum(:date)
        
        # Determine the date to start recomputation from
        compute_from_date = if last_ledger_date && last_ledger_date < today_date
          # Compute from the day after last ledger to fill any gaps up to today
          # This handles new days and ensures continuity
          [last_ledger_date + 1.day, budget.start_date].max
        elsif last_ledger_date.nil?
          # No ledgers exist, compute from start
          budget.start_date
        else
          # Last ledger is today or in the future (shouldn't happen), just compute today
          today_date
        end
        
        # Recompute all missing days up to today
        # This ensures today's ledger is always up-to-date with proper carryover
        Ledger::RecomputeFromDate.call(budget: budget, from_date: compute_from_date)
        
        # Fetch the ledger for today (should exist after recompute)
        ledger = budget.day_ledgers.find_by!(date: today_date)
        
        # Fallback: if ledger doesn't exist (edge case), compute just today
        unless ledger
          Ledger::RecomputeFromDate.call(budget: budget, from_date: today_date)
          ledger = budget.day_ledgers.find_by!(date: today_date)
        end

        render json: {
          date: today_date.iso8601,
          available_cents: ledger.available_cents,
          spent_cents: ledger.spent_cents,
          carryover_start_cents: ledger.carryover_start_cents,
          carryover_end_cents: ledger.carryover_end_cents,
          break_even_spend_cents: ledger.available_cents,
          start_date: budget.start_date.iso8601
        }
      end

      def index
        budget = current_user.budget || create_default_budget
        # Reload to ensure we have fresh associations (especially budget_rates)
        budget.reload

        # Default to showing from budget start_date (not 30 days ago)
        # This prevents computing fake ledgers for days before the user existed
        default_from = [budget.start_date, budget.today_in_timezone - 30.days].max
        
        from_date = params[:from] ? Date.parse(params[:from]) : default_from
        to_date = params[:to] ? Date.parse(params[:to]) : budget.today_in_timezone

        # Clamp from_date to never be before start_date
        from_date = [from_date, budget.start_date].max

        # Ensure ledgers exist for the date range (this will use the latest rates)
        Ledger::RecomputeFromDate.call(budget: budget, from_date: from_date)

        ledgers = budget.day_ledgers
          .where(date: from_date..to_date)
          .order(date: :desc)

        render json: {
          from_date: from_date.iso8601,
          to_date: to_date.iso8601,
          start_date: budget.start_date.iso8601,
          ledgers: ledgers.map { |l| ledger_json(l) }
        }
      end

      private

      def create_default_budget
        current_user.create_budget!(
          base_daily_cents: 2000, # $20.00
          currency: 'CAD',
          timezone: 'America/Toronto'
        )
      end

      def ledger_json(ledger)
        # Get the budget rate that was effective on this date
        daily_rate_cents = ledger.budget.rate_for_date(ledger.date)
        
        {
          date: ledger.date.iso8601,
          spent_cents: ledger.spent_cents,
          carryover_start_cents: ledger.carryover_start_cents,
          carryover_end_cents: ledger.carryover_end_cents,
          available_cents: ledger.available_cents,
          daily_rate_cents: daily_rate_cents
        }
      end
    end
  end
end
