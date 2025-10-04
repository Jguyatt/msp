// Contract Limit Service
// Handles contract limits based on user subscription plans

export const contractLimitService = {
  // Define contract limits for each plan
  getContractLimits() {
    return {
      'Free': 2,
      'Starter': 50,
      'Professional': 200,
      'Enterprise': -1 // -1 means unlimited
    };
  },

  // Get user's current plan (defaults to Free if no subscription)
  async getUserPlan(userId) {
    try {
      console.log('Contract Limit Service - Getting user plan for userId:', userId);
      const { subscriptionService } = await import('./supabaseService');
      const subscription = await subscriptionService.getUserSubscription(userId);
      
      console.log('Contract Limit Service - Subscription result:', subscription);
      
      if (subscription && subscription.status === 'active') {
        console.log('✅ Contract Limit Service - Found active plan:', subscription.plan_name);
        return subscription.plan_name;
      }
      
      // If subscription exists but is canceled, return Free plan
      if (subscription && subscription.status === 'canceled') {
        console.log('⚠️ Contract Limit Service - Subscription canceled, defaulting to Free');
        return 'Free';
      }
      
      console.log('❌ Contract Limit Service - No subscription found, defaulting to Free');
      return 'Free'; // Default to Free plan
    } catch (error) {
      console.error('Error getting user plan:', error);
      return 'Free'; // Default to Free plan on error
    }
  },

  // Get contract limit for a user
  async getUserContractLimit(userId) {
    const plan = await this.getUserPlan(userId);
    const limits = this.getContractLimits();
    return limits[plan] || limits['Free'];
  },

  // Check if user can create more contracts
  async canCreateContract(userId, currentContractCount) {
    const limit = await this.getUserContractLimit(userId);
    
    if (limit === -1) {
      return { canCreate: true, limit: -1, current: currentContractCount };
    }
    
    return {
      canCreate: currentContractCount < limit,
      limit,
      current: currentContractCount,
      remaining: limit - currentContractCount
    };
  },

  // Get upgrade message for limit reached
  getUpgradeMessage(plan, limit, current) {
    const messages = {
      'Free': {
        title: 'Contract Limit Reached',
        message: `You've reached your limit of ${limit} contracts on the Free plan. Upgrade to add more contracts and unlock additional features.`,
        cta: 'Upgrade Now',
        features: ['Up to 50 contracts', 'Team collaboration', 'Custom reminders', 'Advanced analytics']
      },
      'Starter': {
        title: 'Contract Limit Reached',
        message: `You've reached your limit of ${limit} contracts on the Starter plan. Upgrade to add more contracts and unlock additional features.`,
        cta: 'Upgrade Now',
        features: ['Up to 200 contracts', 'Advanced analytics', 'Priority support', 'Custom integrations']
      },
      'Professional': {
        title: 'Contract Limit Reached',
        message: `You've reached your limit of ${limit} contracts on the Professional plan. Upgrade to Enterprise for unlimited contracts.`,
        cta: 'Upgrade to Enterprise',
        features: ['Unlimited contracts', 'Dedicated account manager', 'Custom integrations', 'White-label options']
      }
    };

    return messages[plan] || {
      title: 'Plan Limit Reached',
      message: `You've reached your contract limit. Please upgrade your plan to add more contracts.`,
      cta: 'Upgrade Plan',
      features: []
    };
  },

  // Check if user is approaching their limit (for proactive warnings)
  isApproachingLimit(plan, current, limit) {
    if (limit === -1) return false; // Unlimited plans
    
    const percentage = (current / limit) * 100;
    
    // Warning thresholds
    if (plan === 'Free' && current >= limit - 1) return true; // At limit for Free
    if (plan !== 'Free' && percentage >= 80) return true; // 80% for paid plans
    
    return false;
  },

  // Get proactive warning message
  getProactiveWarning(plan, current, limit) {
    // If already at limit, don't show proactive warning - show upgrade prompt instead
    if (current >= limit) {
      return null;
    }
    
    if (plan === 'Free' && current >= limit - 1) {
      const remaining = limit - current;
      return {
        title: 'Almost at Limit',
        message: `You have ${current}/${limit} contracts. You can add ${remaining} more contract${remaining > 1 ? 's' : ''} before reaching your limit.`,
        type: 'warning'
      };
    }
    
    if (plan !== 'Free') {
      const percentage = Math.round((current / limit) * 100);
      if (percentage >= 80) {
        return {
          title: 'Approaching Limit',
          message: `You're using ${percentage}% of your contract limit (${current}/${limit}). Consider upgrading soon.`,
          type: 'info'
        };
      }
    }
    
    return null;
  }
};
