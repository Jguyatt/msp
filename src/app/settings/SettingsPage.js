import React, { useState, useEffect } from 'react';
import { User, Bell, CreditCard, Upload, Users, AlertTriangle, CheckCircle, Calendar, Download, ExternalLink, Settings as SettingsIcon, Search } from 'lucide-react';
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
  
  // Reminder settings state
  const [reminderIntervals, setReminderIntervals] = useState([90, 60, 30]);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);
  const [savingReminders, setSavingReminders] = useState(false);
  
  // Profile settings state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Sidebar navigation items
  const sidebarItems = [
    { id: 'profile', label: 'Profile Settings', icon: User },
    { id: 'billing', label: 'Billing & Plans', icon: CreditCard },
    { id: 'team', label: 'Team Management', icon: Users },
    { id: 'reminders', label: 'Reminder Rules', icon: Bell }
  ];

  // Fetch subscription data and profile data
  useEffect(() => {
    const fetchData = async () => {
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
        
        // Load profile data
        setFirstName(supabaseUser.first_name || '');
        setLastName(supabaseUser.last_name || '');
        
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
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

  // Reminder settings handlers
  const handleReminderIntervalChange = (days) => {
    setReminderIntervals(prev => {
      if (prev.includes(days)) {
        return prev.filter(d => d !== days);
      } else {
        return [...prev, days].sort((a, b) => b - a);
      }
    });
  };

  const handleSaveReminderSettings = async () => {
    setSavingReminders(true);
    try {
      // Here you would typically save to your backend/database
      // For now, we'll just simulate a save operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // You could add API call here:
      // await fetch('/api/reminder-settings', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     intervals: reminderIntervals,
      //     emailNotifications,
      //     inAppNotifications
      //   })
      // });
      
      alert('Reminder settings saved successfully!');
    } catch (error) {
      console.error('Error saving reminder settings:', error);
      alert('Failed to save reminder settings. Please try again.');
    } finally {
      setSavingReminders(false);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      // Save profile data to Supabase
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://skyexizhdrrqunmllkza.supabase.co';
      const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNreWV4aXpoZHJycXVubWxsa3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MzYxODEsImV4cCI6MjA3NDQxMjE4MX0.MKs-c_vUxw-QiEqwqhgBt0KptbIqh8mXspPlocsdGZQ';
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { error } = await supabase
        .from('users')
        .update({
          first_name: firstName,
          last_name: lastName
        })
        .eq('id', supabaseUser.id);

      if (error) {
        throw error;
      }

      alert('Profile saved successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Profile Settings Component
  const renderProfileSettings = () => {
    return (
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Settings</h2>
        
        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name *
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
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
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={supabaseUser?.email || "guyattj39@gmail.com"}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <button 
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className={`px-6 py-2 rounded-lg transition-colors font-medium ${
              savingProfile 
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                : 'bg-slate-700 text-white hover:bg-slate-800'
            }`}
          >
            {savingProfile ? 'Saving...' : 'Save Changes'}
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
              <button className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Upgrade Plan
              </button>
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
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-gray-900">$79.00</span>
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <Download className="w-4 h-4" />
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
    // Real team data - only show the current user for now
    const teamMembers = [
      {
        id: 1,
        name: supabaseUser?.first_name && supabaseUser?.last_name 
          ? `${supabaseUser.first_name} ${supabaseUser.last_name}`
          : 'Jacob Guyatt',
        email: supabaseUser?.email || 'guyattj39@gmail.com',
        role: 'Owner',
        status: 'active',
        avatar: supabaseUser?.first_name && supabaseUser?.last_name 
          ? `${supabaseUser.first_name[0]}${supabaseUser.last_name[0]}`.toUpperCase()
          : 'JG',
        joinedDate: new Date().toISOString().split('T')[0]
      }
    ];

    const activeMembers = teamMembers.filter(member => member.status === 'active').length;
    const admins = teamMembers.filter(member => member.role === 'Admin' || member.role === 'Owner').length;
    const pendingInvites = teamMembers.filter(member => member.status === 'pending').length;

    const handleInviteMember = () => {
      const email = prompt('Enter email address to invite:');
      if (email && email.includes('@')) {
        // In real app, this would call your backend API
        alert(`Invitation sent to ${email}`);
      } else if (email) {
        alert('Please enter a valid email address');
      }
    };

    const handleRemoveMember = (memberId, memberName) => {
      if (window.confirm(`Are you sure you want to remove ${memberName} from the team?`)) {
        // In real app, this would call your backend API
        alert(`${memberName} has been removed from the team`);
      }
    };

    const handleChangeRole = (memberId, memberName, currentRole) => {
      const newRole = prompt(`Change role for ${memberName} (current: ${currentRole}):\n\nEnter: Admin, Member, or Owner`);
      if (newRole && ['Admin', 'Member', 'Owner'].includes(newRole)) {
        // In real app, this would call your backend API
        alert(`${memberName}'s role has been changed to ${newRole}`);
      }
    };

    return (
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Team Management</h2>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
              <p className="text-gray-600">Manage your team and permissions</p>
            </div>
            <button 
              onClick={handleInviteMember}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Invite Member
            </button>
          </div>
          
          {/* Team Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-slate-900">{activeMembers}</div>
              <div className="text-sm text-slate-600">Active Members</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-slate-900">{admins}</div>
              <div className="text-sm text-slate-600">Admins</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-slate-900">{pendingInvites}</div>
              <div className="text-sm text-slate-600">Pending Invites</div>
            </div>
          </div>

          {/* Team Members List */}
          <div className="bg-white border border-slate-200 rounded-lg">
            <div className="px-6 py-4 border-b border-slate-200">
              <h4 className="text-lg font-semibold text-slate-900">All Team Members</h4>
            </div>
            <div className="divide-y divide-slate-200">
              {teamMembers.map((member) => (
                <div key={member.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-slate-700">{member.avatar}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="text-sm font-medium text-slate-900">{member.name}</h5>
                        {member.status === 'pending' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600">{member.email}</p>
                      {member.joinedDate && (
                        <p className="text-xs text-slate-500">Joined {new Date(member.joinedDate).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <select 
                      value={member.role}
                      onChange={(e) => handleChangeRole(member.id, member.name, member.role)}
                      className="text-sm border border-slate-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    >
                      <option value="Member">Member</option>
                      <option value="Admin">Admin</option>
                      <option value="Owner">Owner</option>
                    </select>
                    {member.role !== 'Owner' && (
                      <button
                        onClick={() => handleRemoveMember(member.id, member.name)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Empty state message */}
              {teamMembers.length === 1 && (
                <div className="px-6 py-8 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-slate-400" />
                  </div>
                  <h5 className="text-lg font-medium text-slate-900 mb-2">You're the only team member</h5>
                  <p className="text-slate-600 mb-4">Invite team members to collaborate on contract management</p>
                  <button 
                    onClick={handleInviteMember}
                    className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    Invite Your First Team Member
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Role Permissions */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-slate-900 mb-4">Role Permissions</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-slate-200 rounded-lg p-4">
                <h5 className="font-medium text-slate-900 mb-2">Owner</h5>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Full system access</li>
                  <li>• Manage team members</li>
                  <li>• Billing and settings</li>
                  <li>• Delete organization</li>
                </ul>
              </div>
              <div className="border border-slate-200 rounded-lg p-4">
                <h5 className="font-medium text-slate-900 mb-2">Admin</h5>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Manage contracts</li>
                  <li>• Invite team members</li>
                  <li>• View reports</li>
                  <li>• Manage reminders</li>
                </ul>
              </div>
              <div className="border border-slate-200 rounded-lg p-4">
                <h5 className="font-medium text-slate-900 mb-2">Member</h5>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• View contracts</li>
                  <li>• Add contracts</li>
                  <li>• View reports</li>
                  <li>• Basic settings</li>
                </ul>
              </div>
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
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Reminder Rules</h2>
          <p className="text-gray-600">Configure automated reminders for contract renewals and important dates.</p>
        </div>

        <div className="space-y-8">
          {/* Reminder Intervals Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Reminder Intervals</h3>
                <p className="text-sm text-gray-600">Select when to receive contract renewal reminders</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[120, 90, 60, 30, 14, 7].map((days) => (
                <label key={days} className="relative flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={reminderIntervals.includes(days)}
                    onChange={() => handleReminderIntervalChange(days)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mr-3 ${
                    reminderIntervals.includes(days) 
                      ? 'bg-slate-700 border-blue-600' 
                      : 'border-gray-300'
                  }`}>
                    {reminderIntervals.includes(days) && (
                      <CheckCircle className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{days} days</div>
                    <div className="text-xs text-gray-500">before expiry</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Notification Settings Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Notification Settings</h3>
                <p className="text-sm text-gray-600">Choose how you want to receive reminders</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Bell className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Email Notifications</div>
                    <div className="text-sm text-gray-600">Receive reminders via email</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className={`w-11 h-6 rounded-full peer transition-colors ${
                    emailNotifications ? 'bg-slate-700' : 'bg-gray-200'
                  }`}>
                    <div className={`absolute top-[2px] left-[2px] bg-white border border-gray-300 rounded-full h-5 w-5 transition-transform ${
                      emailNotifications ? 'translate-x-full' : 'translate-x-0'
                    }`}></div>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Bell className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">In-App Notifications</div>
                    <div className="text-sm text-gray-600">Show reminders in the dashboard</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={inAppNotifications}
                    onChange={(e) => setInAppNotifications(e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className={`w-11 h-6 rounded-full peer transition-colors ${
                    inAppNotifications ? 'bg-slate-700' : 'bg-gray-200'
                  }`}>
                    <div className={`absolute top-[2px] left-[2px] bg-white border border-gray-300 rounded-full h-5 w-5 transition-transform ${
                      inAppNotifications ? 'translate-x-full' : 'translate-x-0'
                    }`}></div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button 
              onClick={handleSaveReminderSettings}
              disabled={savingReminders}
              className={`px-6 py-3 rounded-lg transition-colors font-medium ${
                savingReminders 
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                  : 'bg-slate-700 text-white hover:bg-slate-800'
              }`}
            >
              {savingReminders ? 'Saving...' : 'Save Reminder Settings'}
            </button>
          </div>
        </div>
      </div>
    );
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

export default SettingsPage;