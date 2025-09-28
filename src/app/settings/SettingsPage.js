import React, { useState, useEffect } from 'react';
import { User, Bell, CreditCard, Shield, Upload, Users, AlertTriangle, CheckCircle, Calendar, Download, ExternalLink, Lock, Settings as SettingsIcon, Search } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('profile');

  // Sidebar navigation items
  const sidebarItems = [
    { id: 'profile', label: 'Profile Settings', icon: User },
    { id: 'password', label: 'Password', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'billing', label: 'Billing & Plans', icon: CreditCard },
    { id: 'team', label: 'Team Management', icon: Users },
    { id: 'reminders', label: 'Reminder Rules', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield }
  ];

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

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileSettings();
      case 'billing':
        return renderBillingSettings();
      case 'team':
        return renderTeamSettings();
      case 'reminders':
        return renderReminderSettings();
      default:
        return renderProfileSettings();
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Account settings</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="search for features, services, settings and more"
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
                />
              </div>
              <Bell className="h-5 w-5 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <div className="w-64 bg-white rounded-lg border border-gray-200 p-4 h-fit">
            <nav className="space-y-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                      activeTab === item.id
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-white rounded-lg border border-gray-200 p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

// Profile Settings Component
const renderProfileSettings = () => {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Settings</h2>
      
      {/* Profile Picture Section */}
      <div className="flex items-center gap-6 mb-8">
        <div className="relative">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="h-10 w-10 text-gray-400" />
          </div>
          <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
            <Upload className="h-3 w-3 text-white" />
          </button>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Upload New
          </button>
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            Delete avatar
          </button>
        </div>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            First Name *
                </label>
                <input
                  type="text"
            placeholder="First name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Last Name *
                </label>
          <input
            type="text"
            placeholder="Last name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
                  </div>

                  <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value="guyattj39@gmail.com"
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
          />
                  </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mobile Number *
          </label>
          <div className="flex">
            <select className="px-3 py-2 border border-gray-300 rounded-l-lg border-r-0 bg-gray-50">
              <option>🇳🇬 +234</option>
            </select>
            <input
              type="tel"
              placeholder="0806 123 7890"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
                </div>
              </div>

              <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gender
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input type="radio" name="gender" value="male" defaultChecked className="mr-2" />
              <span className="text-sm text-gray-700">Male</span>
            </label>
            <label className="flex items-center">
              <input type="radio" name="gender" value="female" className="mr-2" />
              <span className="text-sm text-gray-700">Female</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ID
          </label>
          <input
            type="text"
            value="1559 000 7788 8DER"
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tax Identification Number
          </label>
          <input
            type="text"
            placeholder="Tax ID"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tax Identification Country
          </label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option>🇳🇬 Nigeria</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Residential Address
          </label>
          <input
            type="text"
            placeholder="Ib street orogun ibadan"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Save Changes
        </button>
      </div>
    </div>
  );
};

// Billing Settings Component
const renderBillingSettings = () => {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Billing & Plans</h2>
      <div className="space-y-6">
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Plan</h3>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">Professional Plan</div>
              <div className="text-gray-600">$79/month • 200 contracts</div>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Upgrade Plan
            </button>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Card Number
                </label>
              <input
                type="text"
                placeholder="**** **** **** 1234"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Date
              </label>
              <input
                type="text"
                placeholder="MM/YY"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Invoices</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="font-medium text-gray-900">Invoice #12345</div>
                <div className="text-sm text-gray-600">Dec 15, 2024</div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-900">$79.00</span>
                <button className="text-blue-600 hover:text-blue-700">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Team Settings Component
const renderTeamSettings = () => {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Team Management</h2>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
            <p className="text-gray-600">Manage your team and permissions</p>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Invite Member
          </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-900">3</div>
            <div className="text-sm text-gray-600">Active Members</div>
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
            </div>
  );
};

// Reminder Settings Component
const renderReminderSettings = () => {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Reminder Rules</h2>
      <div className="space-y-6">
              <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
                  Reminder Intervals
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[120, 90, 60, 30, 14, 7].map((days) => (
                    <label key={days} className="flex items-center">
                      <input
                        type="checkbox"
                        defaultChecked={[90, 60, 30].includes(days)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                <span className="ml-2 text-sm text-gray-700">{days} days</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Template
                </label>
                <textarea
                  rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Subject: Contract Renewal Reminder

Dear {{recipient_name}},

This is a reminder that your contract with {{vendor_name}} will expire on {{end_date}}.

We recommend reviewing this contract before it expires to ensure continuity of services.

Please let us know if you have any questions.

Best regards,
TechFlow Solutions"
          />
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
