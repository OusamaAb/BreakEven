module Api
  module V1
    class StatsController < ApplicationController
      BUCKETS = %w[daily weekly monthly].freeze

      def spending
        budget = current_user.budget
        return render json: { error: 'Budget not found' }, status: :not_found unless budget

        from_date = safe_parse_date_param(:from, fallback: budget.today_in_timezone - 30.days)
        return unless from_date # Return early if date parsing failed
        
        to_date = safe_parse_date_param(:to, fallback: budget.today_in_timezone)
        return unless to_date # Return early if date parsing failed
        bucket = BUCKETS.include?(params[:bucket]) ? params[:bucket] : 'daily'
        category_filter = params[:category].presence

        expenses = budget.expenses.where(date: from_date..to_date)
        expenses = expenses.where(category: category_filter) if category_filter

        expense_points = expenses.map do |expense|
          {
            date: expense.date,
            amount_cents: expense.amount_cents,
            category: expense.category,
            kind: :expense
          }
        end

        subscriptions = current_user.subscriptions.active
        subscriptions = subscriptions.where(category: category_filter) if category_filter

        subscription_points = subscriptions.flat_map do |subscription|
          charge_dates_for(subscription, from_date, to_date).map do |charge_date|
            {
              date: charge_date,
              amount_cents: subscription.amount_cents,
              category: subscription.category,
              kind: :subscription
            }
          end
        end

        all_points = expense_points + subscription_points
        bucketed = bucketize(all_points, from_date, to_date, bucket)

        category_totals = all_points.group_by { |p| p[:category] }.transform_values do |items|
          items.sum { |p| p[:amount_cents] }
        end
        category_totals_expense = expense_points.group_by { |p| p[:category] }.transform_values do |items|
          items.sum { |p| p[:amount_cents] }
        end
        category_totals_subscription = subscription_points.group_by { |p| p[:category] }.transform_values do |items|
          items.sum { |p| p[:amount_cents] }
        end

        render json: {
          from_date: from_date.iso8601,
          to_date: to_date.iso8601,
          bucket: bucket,
          category: category_filter,
          buckets: bucketed,
          totals: {
            total_cents: all_points.sum { |p| p[:amount_cents] },
            expense_cents: expense_points.sum { |p| p[:amount_cents] },
            subscription_cents: subscription_points.sum { |p| p[:amount_cents] }
          },
          category_totals: category_totals,
          category_totals_expense: category_totals_expense,
          category_totals_subscription: category_totals_subscription
        }
      end

      private

      def charge_dates_for(subscription, from_date, to_date)
        period = subscription.billing_cycle == 'monthly' ? { months: 1 } : { years: 1 }
        dates = []
        lower_bound = [from_date, subscription.created_at.to_date].max
        return dates if lower_bound > to_date

        # Find the earliest occurrence on or before the range start by stepping back
        current = subscription.next_charge_date
        36.times do
          previous = current.advance(period.transform_values { |v| -v })
          break if previous < lower_bound
          current = previous
        end

        # Move forward through the range
        48.times do
          break if current > to_date
          dates << current if current >= lower_bound
          current = current.advance(period)
        end

        dates
      end

      def bucketize(points, from_date, to_date, bucket)
        buckets = bucket_range(from_date, to_date, bucket).index_with do |date|
          {
            bucket_start: date.iso8601,
            total_cents: 0,
            expense_cents: 0,
            subscription_cents: 0
          }
        end

        points.each do |point|
          key = bucket_key(point[:date], bucket)
          entry = buckets[key] || {
            bucket_start: key.iso8601,
            total_cents: 0,
            expense_cents: 0,
            subscription_cents: 0
          }

          entry[:total_cents] += point[:amount_cents]
          if point[:kind] == :expense
            entry[:expense_cents] += point[:amount_cents]
          else
            entry[:subscription_cents] += point[:amount_cents]
          end

          buckets[key] = entry
        end

        buckets.values.sort_by { |b| b[:bucket_start] }
      end

      def bucket_range(from_date, to_date, bucket)
        dates = []
        current = bucket_key(from_date, bucket)

        while current <= to_date
          dates << current
          current = advance_bucket(current, bucket)
        end

        dates
      end

      def bucket_key(date, bucket)
        case bucket
        when 'weekly'
          date.beginning_of_week(:monday)
        when 'monthly'
          date.beginning_of_month
        else
          date
        end
      end

      def advance_bucket(date, bucket)
        case bucket
        when 'weekly'
          date + 7.days
        when 'monthly'
          date.next_month
        else
          date + 1.day
        end
      end
    end
  end
end
