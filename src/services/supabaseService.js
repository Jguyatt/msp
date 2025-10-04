import { supabase } from '../lib/supabase';
import { awsUploadService as fileUploadService } from './awsUploadService';
import { obligationService } from './obligationService';

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

  // Get contract clauses for a specific contract
  async getContractClauses(contractId) {
    try {
      const { data, error } = await supabase
        .from('contract_clauses')
        .select('*')
        .eq('contract_id', contractId)
        .order('extracted_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
        console.error('Error fetching contract clauses:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getContractClauses:', error);
      return null;
    }
  },

  // Get contracts for current user (by email)
  async getContractsForUser(userEmail) {
    try {
      console.log('getContractsForUser called with email:', userEmail);
      
      // First get the user to find their company
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('company_id')
        .eq('email', userEmail)
        .single();

      console.log('User lookup result:', { user, userError });

      if (userError || !user) {
        console.error('User lookup error:', userError);
        return []; // Return empty array if user not found
      }

      console.log('Looking for contracts with company_id:', user.company_id);
      
      // Get contracts for the company
      const { data: contracts, error } = await supabase
        .from('contracts')
        .select(`
          *,
          contract_pdf_url,
          contract_pdf_id,
          reminders (
            id,
            reminder_type,
            days_before_expiry,
            sent_at,
            status
          )
        `)
        .eq('company_id', user.company_id)
        .order('end_date', { ascending: true });

      console.log('Contracts query result:', { contracts, error });

      if (error) {
        console.error('Contracts fetch error:', error);
        throw new Error('Failed to fetch contracts');
      }

      // Add calculated fields
      const contractsWithCalculations = contracts.map(contract => {
        let daysUntil = 0;
        if (contract.end_date) {
          const endDate = new Date(contract.end_date);
          if (!isNaN(endDate.getTime())) {
            const today = new Date();
            daysUntil = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
          }
        }
        
        // Create reminders object from database data
        const reminders = {
          d90: false,
          d60: false,
          d30: false
        };
        
        if (contract.reminders) {
          contract.reminders.forEach(reminder => {
            if (reminder.reminder_type === '90_day' && reminder.status === 'sent') {
              reminders.d90 = true;
            } else if (reminder.reminder_type === '60_day' && reminder.status === 'sent') {
              reminders.d60 = true;
            } else if (reminder.reminder_type === '30_day' && reminder.status === 'sent') {
              reminders.d30 = true;
            }
          });
        }
        
        return {
          ...contract,
          daysUntil,
          reminders,
          value: contract.value || 0
        };
      });
      
      return contractsWithCalculations;
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
  async createContract(contractData, userEmail, pdfFile = null) {
    try {
      console.log('Starting contract creation for user:', userEmail);
      
      // First get the user to find their company
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('company_id, id')
        .eq('email', userEmail)
        .single();

      console.log('User lookup result:', { user, userError });

      if (userError) {
        console.error('User lookup error:', userError);
        if (userError.code === 'PGRST116') {
          throw new Error('User not found. Please make sure you are logged in and your account is set up.');
        }
        throw new Error(`User lookup failed: ${userError.message}`);
      }

      if (!user) {
        throw new Error('User not found in database. Please contact support.');
      }

      console.log('User found:', user);

      // Add company_id and created_by to contract data
      const contractWithCompany = {
        ...contractData,
        company_id: user.company_id,
        created_by: user.id
      };

      console.log('Contract data to insert:', contractWithCompany);

      const { data, error } = await supabase
        .from('contracts')
        .insert([contractWithCompany])
        .select()
        .single();

      console.log('Contract insert result:', { data, error });

      if (error) {
        console.error('Contract creation error:', error);
        if (error.code === '23505') {
          throw new Error('A contract with this information already exists.');
        } else if (error.code === '23503') {
          throw new Error('Invalid company or user reference. Please contact support.');
        }
        throw new Error(`Failed to create contract: ${error.message}`);
      }

      console.log('Contract created successfully:', data);

      // Handle PDF upload if provided
      if (pdfFile) {
        try {
          console.log('Uploading PDF file...');
          const fileResult = await fileUploadService.uploadContractPDF(
            pdfFile,
            data.id,
            user.id,
            user.company_id
          );
          
          // Update contract with PDF info
          const { error: updateError } = await supabase
            .from('contracts')
            .update({
              contract_pdf_id: fileResult.id,
              contract_pdf_url: fileResult.url
            })
            .eq('id', data.id);

          if (updateError) {
            console.warn('Failed to update contract with PDF info:', updateError);
          } else {
            console.log('Contract updated with PDF info');
            data.contract_pdf_id = fileResult.id;
            data.contract_pdf_url = fileResult.url;
          }
        } catch (pdfError) {
          console.warn('PDF upload failed, but contract was created:', pdfError);
          // Don't fail the entire operation if PDF upload fails
        }
      }

      // Create audit log entry (optional, don't fail if this fails)
      try {
        await supabase
          .from('audit_logs')
          .insert([{
            contract_id: data.id,
            user_id: user.id,
            action: 'contract_created',
            details: `Contract created: ${data.vendor} - ${data.contract_name}`,
            changes: {
              vendor: data.vendor,
              contract_name: data.contract_name,
              end_date: data.end_date,
              value: data.value
            }
          }]);
        console.log('Audit log created successfully');
      } catch (auditError) {
        console.warn('Failed to create audit log:', auditError);
        // Don't throw here, contract creation was successful
      }

      return data;
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
      console.log('syncClerkUser: Starting sync for:', clerkUser.emailAddresses[0].emailAddress);
      
      // First, check if user already exists
      const { data: existingUser, error: existingUserError } = await supabase
        .from('users')
        .select('*')
        .eq('email', clerkUser.emailAddresses[0].emailAddress)
        .single();

      console.log('syncClerkUser: Existing user check:', { existingUser, existingUserError });

      if (existingUser) {
        console.log('syncClerkUser: Updating existing user');
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

        if (error) {
          console.error('syncClerkUser: Error updating user:', error);
          throw error;
        }
        console.log('syncClerkUser: User updated successfully:', data);
        return data;
      } else {
        console.log('syncClerkUser: Creating new user and company');
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

        if (companyError) {
          console.error('syncClerkUser: Error creating company:', companyError);
          throw companyError;
        }
        console.log('syncClerkUser: Company created:', company);

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

        if (userError) {
          console.error('syncClerkUser: Error creating user:', userError);
          throw userError;
        }
        console.log('syncClerkUser: User created successfully:', user);
        return user;
      }
    } catch (error) {
      console.error('syncClerkUser: Error syncing Clerk user:', error);
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
      
      // First try to get any subscription (active or canceled)
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(); // Use maybeSingle instead of single to handle no results gracefully

      console.log('Subscription Service - Query result:', { data, error });
      
      if (error) {
        console.error('Database error:', error);
        return null; // Return null instead of throwing
      }
      
      if (data) {
        console.log('✅ Found subscription:', data.plan_name, 'Status:', data.status, 'for user:', userId);
        return data;
      } else {
        console.log('❌ No subscription found for user:', userId);
        return null;
      }
      
    } catch (error) {
      console.error('Error getting user subscription:', error);
      return null; // Return null instead of throwing to prevent UI crashes
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

// Export obligation service for task management
export { obligationService };
