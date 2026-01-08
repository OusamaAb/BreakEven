module Api
  module V1
    class ExpensesController < ApplicationController
      def index
        budget = current_user.budget
        return render json: { error: 'Budget not found' }, status: :not_found unless budget

        from_date = params[:from] ? Date.parse(params[:from]) : budget.today_in_timezone - 30.days
        to_date = params[:to] ? Date.parse(params[:to]) : budget.today_in_timezone

        expenses = budget.expenses
          .where(date: from_date..to_date)
          .order(date: :desc, created_at: :desc)

        render json: {
          from_date: from_date.iso8601,
          to_date: to_date.iso8601,
          expenses: expenses.map { |e| expense_json(e) }
        }
      end

      def create
        budget = current_user.budget || create_default_budget
        
        expense = budget.expenses.build(expense_params)

        if expense.save
          render json: expense_json(expense), status: :created
        else
          render json: { errors: expense.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        expense = find_expense
        return unless expense

        if expense.update(expense_params)
          render json: expense_json(expense)
        else
          render json: { errors: expense.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        expense = find_expense
        return unless expense

        expense.destroy
        head :no_content
      end

      private

      def find_expense
        expense = Expense.find_by(id: params[:id])
        
        unless expense
          render json: { error: 'Expense not found' }, status: :not_found
          return nil
        end

        unless expense.budget.user_id == current_user.id
          render json: { error: 'Unauthorized' }, status: :forbidden
          return nil
        end

        expense
      end

      def create_default_budget
        current_user.create_budget!(
          base_daily_cents: 2000,
          currency: 'CAD',
          timezone: 'America/Toronto'
        )
      end

      def expense_params
        params.permit(:date, :amount_cents, :category, :note)
      end

      def expense_json(expense)
        {
          id: expense.id,
          date: expense.date.iso8601,
          amount_cents: expense.amount_cents,
          category: expense.category,
          note: expense.note,
          created_at: expense.created_at,
          updated_at: expense.updated_at
        }
      end
    end
  end
end

