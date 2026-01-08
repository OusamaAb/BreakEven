require 'rails_helper'

RSpec.describe Subscription, type: :model do
  describe 'associations' do
    it { should belong_to(:user) }
  end

  describe 'validations' do
    it { should validate_presence_of(:name) }
    it { should validate_presence_of(:amount_cents) }
    it { should validate_numericality_of(:amount_cents).is_greater_than(0) }
    it { should validate_presence_of(:billing_cycle) }
    it { should validate_inclusion_of(:billing_cycle).in_array(%w[monthly yearly]) }
    it { should validate_presence_of(:category) }
    it { should validate_inclusion_of(:category).in_array(%w[streaming software music news fitness cloud_storage gaming other]) }
    it { should validate_presence_of(:status) }
    it { should validate_inclusion_of(:status).in_array(%w[active paused]) }
    it { should validate_presence_of(:next_charge_date) }
  end

  describe 'scopes' do
    let!(:active_subscription) { create(:subscription, status: 'active') }
    let!(:paused_subscription) { create(:subscription, status: 'paused') }
    
    describe '.active' do
      it 'returns only active subscriptions' do
        expect(Subscription.active).to include(active_subscription)
        expect(Subscription.active).not_to include(paused_subscription)
      end
    end

    describe '.paused' do
      it 'returns only paused subscriptions' do
        expect(Subscription.paused).to include(paused_subscription)
        expect(Subscription.paused).not_to include(active_subscription)
      end
    end
  end

  describe '#monthly_cost_cents' do
    it 'returns amount_cents for monthly subscriptions' do
      subscription = build(:subscription, billing_cycle: 'monthly', amount_cents: 1000)
      expect(subscription.monthly_cost_cents).to eq(1000)
    end

    it 'returns amount_cents / 12 for yearly subscriptions' do
      subscription = build(:subscription, billing_cycle: 'yearly', amount_cents: 12000)
      expect(subscription.monthly_cost_cents).to eq(1000) # 12000 / 12
    end

    it 'rounds up for yearly subscriptions' do
      subscription = build(:subscription, billing_cycle: 'yearly', amount_cents: 12001)
      expect(subscription.monthly_cost_cents).to eq(1001) # ceil(12001 / 12)
    end
  end

  describe '#charges_soon?' do
    it 'returns true if next_charge_date is within specified days' do
      subscription = build(:subscription, next_charge_date: Date.current + 5.days)
      expect(subscription.charges_soon?(7)).to be true
    end

    it 'returns false if next_charge_date is beyond specified days' do
      subscription = build(:subscription, next_charge_date: Date.current + 10.days)
      expect(subscription.charges_soon?(7)).to be false
    end

    it 'returns true if next_charge_date is today' do
      subscription = build(:subscription, next_charge_date: Date.current)
      expect(subscription.charges_soon?(7)).to be true
    end
  end

  describe 'callbacks' do
    describe '#ensure_next_charge_date_current' do
      it 'advances next_charge_date if it has passed for monthly subscription' do
        past_date = Date.current - 5.days
        subscription = build(:subscription, 
          billing_cycle: 'monthly',
          next_charge_date: past_date,
          last_charged_date: nil
        )
        
        subscription.save!
        subscription.reload
        
        expect(subscription.last_charged_date).to eq(past_date)
        expect(subscription.next_charge_date).to eq(past_date.next_month)
      end

      it 'advances next_charge_date if it has passed for yearly subscription' do
        past_date = Date.current - 5.days
        subscription = build(:subscription,
          billing_cycle: 'yearly',
          next_charge_date: past_date,
          last_charged_date: nil
        )
        
        subscription.save!
        subscription.reload
        
        expect(subscription.last_charged_date).to eq(past_date)
        expect(subscription.next_charge_date).to eq(past_date.next_year)
      end
    end

    describe '#set_initial_next_charge_date' do
      it 'sets next_charge_date for monthly subscription if not set' do
        subscription = build(:subscription,
          billing_cycle: 'monthly',
          next_charge_date: nil
        )
        
        subscription.save!
        
        expect(subscription.next_charge_date).to eq(Date.current.next_month)
      end

      it 'sets next_charge_date for yearly subscription if not set' do
        subscription = build(:subscription,
          billing_cycle: 'yearly',
          next_charge_date: nil
        )
        
        subscription.save!
        
        expect(subscription.next_charge_date).to eq(Date.current.next_year)
      end
    end
  end

  describe 'factory' do
    it 'creates a valid subscription' do
      subscription = build(:subscription)
      expect(subscription).to be_valid
    end
  end
end

