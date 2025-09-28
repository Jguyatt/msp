import { supabase } from '../lib/supabase';

// Contract operations
export const contractService = {
  // Get all contracts for a company
  async getContracts(companyId) {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        reminders (
          id,
          reminder_type,
          days_before_expiry,
          sent_at,
          status
        )
      `)
      .eq('company_id', companyId)
      .order('end_date', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Get contracts for current user (by email)
  async getContractsForUser(userEmail) {
    try {
      const response = await fetch(`/api/contracts?userEmail=${encodeURIComponent(userEmail)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch contracts');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting contracts for user:', error);
      throw error;
    }
  },

  // Get a single contract
  async getContract(id) {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        reminders (
          id,
          reminder_type,
          days_before_expiry,
          sent_at,
          status,
          recipient_email,
          template_used
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create a new contract
  async createContract(contractData, userEmail) {
    try {
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractData,
          userEmail
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create contract');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating contract:', error);
      throw error;
    }
  },

  // Update a contract
  async updateContract(id, updates) {
    const { data, error } = await supabase
      .from('contracts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a contract
  async deleteContract(id) {
    const { error } = await supabase
      .from('contracts')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // Bulk delete contracts
  async deleteContracts(ids) {
    const { error } = await supabase
      .from('contracts')
      .delete()
      .in('id', ids);

    if (error) throw error;
    return true;
  },

  // Upload contracts from CSV
  async uploadContracts(contracts) {
    const { data, error } = await supabase
      .from('contracts')
      .insert(contracts)
      .select();

    if (error) throw error;
    return data;
  }
};

// User operations
export const userService = {
  // Sync Clerk user with Supabase
  async syncClerkUser(clerkUser) {
    try {
      // First, check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', clerkUser.emailAddresses[0].emailAddress)
        .single();

      if (existingUser) {
        // Update existing user with latest Clerk data
        const { data, error } = await supabase
          .from('users')
          .update({
            full_name: clerkUser.fullName || clerkUser.firstName + ' ' + clerkUser.lastName,
            last_active: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('email', clerkUser.emailAddresses[0].emailAddress)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new user and company
        const companyName = clerkUser.emailAddresses[0].emailAddress.split('@')[1];
        
        // Create company first
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .insert([{
            name: companyName,
            domain: companyName
          }])
          .select()
          .single();

        if (companyError) throw companyError;

        // Create user
        const { data: user, error: userError } = await supabase
          .from('users')
          .insert([{
            email: clerkUser.emailAddresses[0].emailAddress,
            full_name: clerkUser.fullName || clerkUser.firstName + ' ' + clerkUser.lastName,
            company_id: company.id,
            role: 'admin', // First user is admin
            status: 'active'
          }])
          .select()
          .single();

        if (userError) throw userError;
        return user;
      }
    } catch (error) {
      console.error('Error syncing Clerk user:', error);
      throw error;
    }
  },

  // Get current user by email
  async getCurrentUser(email) {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        companies (
          id,
          name,
          domain
        )
      `)
      .eq('email', email)
      .single();

    if (error) throw error;
    return data;
  },

  // Get all users for a company
  async getUsers(companyId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get a single user
  async getUser(id) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Update user role
  async updateUserRole(id, role) {
    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete user
  async deleteUser(id) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};

// Subscription operations
export const subscriptionService = {
  // Create or update subscription from Stripe webhook
  async upsertSubscription(subscriptionData) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .upsert([subscriptionData], {
          onConflict: 'stripe_subscription_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error upserting subscription:', error);
      throw error;
    }
  },

  // Get user's subscription
  async getUserSubscription(userId) {
    try {
      console.log('Subscription Service - Looking for subscription with user_id:', userId);
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      console.log('Subscription Service - Query result:', { data, error });
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return data;
    } catch (error) {
      console.error('Error getting user subscription:', error);
      throw error;
    }
  },

  // Get subscription by Stripe subscription ID
  async getSubscriptionByStripeId(stripeSubscriptionId) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('stripe_subscription_id', stripeSubscriptionId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting subscription by Stripe ID:', error);
      throw error;
    }
  },

  // Update subscription status
  async updateSubscriptionStatus(stripeSubscriptionId, status, additionalData = {}) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          status,
          ...additionalData,
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', stripeSubscriptionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating subscription status:', error);
      throw error;
    }
  }
};

// Team invitation operations
export const teamService = {
  // Get team invitations
  async getInvitations(companyId) {
    const { data, error } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Create team invitation
  async createInvitation(invitationData) {
    const { data, error } = await supabase
      .from('team_invitations')
      .insert([invitationData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Accept invitation
  async acceptInvitation(token) {
    const { data, error } = await supabase
      .from('team_invitations')
      .update({ status: 'accepted' })
      .eq('token', token)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Audit log operations
export const auditService = {
  // Get audit logs for a contract
  async getAuditLogs(contractId) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select(`
        *,
        users (
          full_name,
          email
        )
      `)
      .eq('contract_id', contractId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Create audit log entry
  async createAuditLog(logData) {
    const { data, error } = await supabase
      .from('audit_logs')
      .insert([logData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Reminder operations
export const reminderService = {
  // Get reminders for a contract
  async getReminders(contractId) {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('contract_id', contractId)
      .order('days_before_expiry', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Create reminder
  async createReminder(reminderData) {
    const { data, error } = await supabase
      .from('reminders')
      .insert([reminderData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update reminder status
  async updateReminderStatus(id, status, sentAt = null) {
    const updates = { status };
    if (sentAt) updates.sent_at = sentAt;

    const { data, error } = await supabase
      .from('reminders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Analytics operations
export const analyticsService = {
  // Get contract statistics
  async getContractStats(companyId) {
    const { data, error } = await supabase
      .from('contracts')
      .select('id, end_date, value, status')
      .eq('company_id', companyId);

    if (error) throw error;

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const stats = {
      totalContracts: data.length,
      totalValue: data.reduce((sum, contract) => sum + (contract.value || 0), 0),
      expiringSoon: data.filter(contract => {
        const endDate = new Date(contract.end_date);
        return endDate <= thirtyDaysFromNow && endDate >= now;
      }).length,
      expiringThisQuarter: data.filter(contract => {
        const endDate = new Date(contract.end_date);
        return endDate <= ninetyDaysFromNow && endDate >= now;
      }).length,
      activeContracts: data.filter(contract => contract.status === 'active').length
    };

    return stats;
  },

  // Get contracts expiring soon
  async getExpiringContracts(companyId, days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);

    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .lte('end_date', cutoffDate.toISOString().split('T')[0])
      .order('end_date', { ascending: true });

    if (error) throw error;
    return data;
  }
};
