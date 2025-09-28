import React, { useState, useEffect } from 'react';
import { User, Bell, CreditCard, Shield, Upload, Users, AlertTriangle, CheckCircle, Calendar, Download, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUserSync } from '../../hooks/useUserSync';
import { subscriptionService } from '../../services/supabaseService';

function SettingsPage() {
  const { clerkUser, supabaseUser, loading: userLoading } = useUserSync();
  const [companyName, setCompanyName] = useState('');
  const [domain, setDomain] = useState('');
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [invoices, setInvoices] = useState([]);

  // Fetch subscription data
  useEffect(() => {
    const fetchSubscriptionData = async () => {
      if (userLoading || !supabaseUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Get user's subscription
        const userSubscription = await subscriptionService.getUserSubscription(supabaseUser.id);
        console.log('Settings Page - Fetched subscription:', userSubscription);
        console.log('Settings Page - Supabase User ID:', supabaseUser.id);
        setSubscription(userSubscription);
        
        // Set company info from user data
        if (supabaseUser.companies) {
          setCompanyName(supabaseUser.companies.name || '');
          setDomain(supabaseUser.companies.domain || '');
        }
        
        // TODO: Fetch real invoices from Stripe
        // For now, show mock data based on subscription
        if (userSubscription) {
          setInvoices([
            {
              id: userSubscription.stripe_subscription_id?.slice(-8) || '12345',
              amount: getPlanPrice(userSubscription.plan_name),
              date: new Date(userSubscription.current_period_start).toLocaleDateString(),
              status: 'paid',
              url: `https://dashboard.stripe.com/invoices/${userSubscription.stripe_subscription_id}`
            }
          ]);
        }
        
      } catch (error) {
        console.error('Error fetching subscription data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionData();
  }, [supabaseUser, userLoading]);

  const getPlanPrice = (planName) => {
    const prices = {
      'Free': 0,
      'Starter': 29,
      'Professional': 79,
      'Enterprise': 'Custom'
    };
    return prices[planName] || 0;
  };

  const getPlanLimits = (planName) => {
    const limits = {
      'Free': 5,
      'Starter': 50,
      'Professional': 200,
      'Enterprise': 'Unlimited'
    };
    return limits[planName] || 5;
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your current billing period.'
    );
    
    if (!confirmed) return;
    
    try {
      setCancelling(true);
      
      // Call your backend API to cancel subscription in Stripe
      const response = await fetch('http://localhost:3001/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscription.stripe_subscription_id,
          cancelAtPeriodEnd: true // Cancel at end of billing period
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }
      
      // Refresh subscription data
      const updatedSubscription = await subscriptionService.getUserSubscription(supabaseUser.id);
      setSubscription(updatedSubscription);
      
      alert('Your subscription has been canceled. You will retain access until the end of your current billing period.');
      
    } catch (error) {
      console.error('Error canceling subscription:', error);
      alert('Error canceling subscription. Please try again or contact support.');
    } finally {
      setCancelling(false);
    }
  };

  const handleUpgrade = () => {
    window.open('/app/plans', '_blank');
  };

  const handleDownloadInvoice = (invoice) => {
    if (invoice.url) {
      window.open(invoice.url, '_blank');
    } else {
      alert('Invoice download not available. Please contact support.');
    }
  };

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
          <p className="text-slate-600 mt-1">Manage your account and preferences</p>
        </div>

        <div className="space-y-8">
          {/* Account Settings */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <User className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-slate-900">Account Settings</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Domain
                </label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Logo Upload
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center">
                    <span className="text-slate-400">Logo</span>
                  </div>
                  <div>
                    <button
                      onClick={() => alert('Logo upload coming soon!')}
                      className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Upload
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Signature
                </label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Best regards,&#10;&#10;TechFlow Solutions Team"
                />
              </div>
            </div>
          </div>

          {/* Team Management */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-slate-900">Team Management</h3>
              </div>
              <Link
                to="/app/team"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Users className="h-4 w-4" />
                Manage Team
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-900">3</div>
                <div className="text-sm text-gray-600">Team Members</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-900">1</div>
                <div className="text-sm text-gray-600">Admins</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-900">2</div>
                <div className="text-sm text-gray-600">Pending Invites</div>
              </div>
            </div>
          </div>

          {/* Reminder Rules */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-slate-900">Reminder Rules</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Reminder Intervals
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[120, 90, 60, 30, 14, 7].map((days) => (
                    <label key={days} className="flex items-center">
                      <input
                        type="checkbox"
                        defaultChecked={[90, 60, 30].includes(days)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-slate-700">{days} days</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Template
                </label>
                <textarea
                  rows={6}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Subject: Contract Renewal Reminder&#10;&#10;Dear {{recipient_name}},&#10;&#10;This is a reminder that your contract with {{vendor_name}} will expire on {{end_date}}.&#10;&#10;We recommend reviewing this contract before it expires to ensure continuity of services.&#10;&#10;Please let us know if you have any questions.&#10;&#10;Best regards,&#10;TechFlow Solutions"
                />
                <button
                  onClick={() => alert('Template preview functionality coming soon!')}
                  className="mt-2 px-3 py-1 bg-slate-100 text-slate-700 rounded text-sm hover:bg-slate-200"
                >
                  Preview
                </button>
              </div>
            </div>
          </div>

          {/* Billing */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-slate-900">Billing & Plans</h3>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-slate-600">Loading subscription data...</span>
              </div>
            ) : subscription ? (
              <div className="space-y-4">
                {/* Current Subscription */}
                <div className={`p-4 rounded-lg border ${
                  subscription.status === 'active' 
                    ? 'bg-green-50 border-green-200' 
                    : subscription.status === 'canceled'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-medium text-slate-900 flex items-center gap-2">
                          {subscription.plan_name} Plan
                          {subscription.status === 'active' && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                          {subscription.status === 'canceled' && (
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          )}
                          {subscription.status === 'past_due' && (
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          )}
                        </div>
                        <div className="text-sm text-slate-600">
                          ${getPlanPrice(subscription.plan_name)}/month • {getPlanLimits(subscription.plan_name)} contracts
                        </div>
                        {subscription.current_period_end && (
                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {subscription.status === 'canceled' 
                              ? `Access ends ${new Date(subscription.current_period_end).toLocaleDateString()}`
                              : `Next billing: ${new Date(subscription.current_period_end).toLocaleDateString()}`
                            }
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {subscription.plan_name !== 'Enterprise' && (
                        <button 
                          onClick={handleUpgrade}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Upgrade
                        </button>
                      )}
                      {subscription.status === 'active' && (
                        <button 
                          onClick={handleCancelSubscription}
                          disabled={cancelling}
                          className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                        >
                          {cancelling ? 'Canceling...' : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Subscription Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="text-sm text-slate-600 mb-1">Subscription ID</div>
                    <div className="font-mono text-sm text-slate-900">
                      {subscription.stripe_subscription_id}
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="text-sm text-slate-600 mb-1">Status</div>
                    <div className={`text-sm font-medium ${
                      subscription.status === 'active' ? 'text-green-600' :
                      subscription.status === 'canceled' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>
                      {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                    </div>
                  </div>
                </div>

                {/* Recent Invoices */}
                {invoices.length > 0 && (
                  <div>
                    <h4 className="font-medium text-slate-900 mb-3">Recent Invoices</h4>
                    <div className="space-y-2">
                      {invoices.map((invoice, index) => (
                        <div key={index} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded">
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-700">
                              Invoice #{invoice.id} - ${invoice.amount}
                            </span>
                            <span className="text-xs text-slate-500">{invoice.date}</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              invoice.status === 'paid' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {invoice.status}
                            </span>
                          </div>
                          <button 
                            onClick={() => handleDownloadInvoice(invoice)}
                            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          >
                            <Download className="h-3 w-3" />
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stripe Dashboard Link */}
                <div className="pt-4 border-t border-slate-200">
                  <a
                    href="https://dashboard.stripe.com/customers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Manage billing in Stripe Dashboard
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-slate-500 mb-4">No active subscription found</div>
                <Link
                  to="/app/plans"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <CreditCard className="h-4 w-4" />
                  Choose a Plan
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
