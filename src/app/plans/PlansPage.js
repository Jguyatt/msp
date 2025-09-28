import React, { useState, useEffect } from 'react';
import { Check, Star, Shield, Users, Zap, Award, ChevronDown, ChevronUp, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUserSync } from '../../hooks/useUserSync';
import { subscriptionService } from '../../services/supabaseService';

function PlansPage() {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const { clerkUser, supabaseUser, loading: userLoading } = useUserSync();

  // Fetch current subscription
  useEffect(() => {
    const fetchCurrentSubscription = async () => {
      if (userLoading || !supabaseUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const subscription = await subscriptionService.getUserSubscription(supabaseUser.id);
        console.log('Plans Page - Fetched subscription:', subscription);
        console.log('Plans Page - Supabase User ID:', supabaseUser.id);
        setCurrentSubscription(subscription);
      } catch (error) {
        console.error('Error fetching current subscription:', error);
        setCurrentSubscription(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentSubscription();
  }, [supabaseUser, userLoading]);

  const plans = [
    {
      name: 'Free',
      price: { monthly: 0, annual: 0 },
      description: 'Perfect for individuals and small teams getting started',
      features: [
        'Up to 5 contracts',
        'Email reminders (90/60/30 days)',
        'CSV contract upload',
        'PDF contract upload',
        'Basic dashboard & reporting',
        'Export to CSV'
      ],
      cta: 'Current Plan',
      ctaVariant: 'current',
      popular: false
    },
    {
      name: 'Starter',
      price: { monthly: 29, annual: 290 },
      description: 'Ideal for growing MSPs and small businesses',
      features: [
        'Up to 50 contracts',
        'Email reminders (customizable)',
        'Team collaboration (3 users)',
        'CSV & PDF contract upload',
        'Contract management dashboard',
        'Export & reporting'
      ],
      cta: 'Upgrade to Starter',
      ctaVariant: 'upgrade',
      popular: false
    },
    {
      name: 'Professional',
      price: { monthly: 79, annual: 790 },
      description: 'Built for established MSPs and mid-size companies',
      features: [
        'Up to 200 contracts',
        'Custom reminder workflows',
        'Unlimited team members',
        'Advanced contract management',
        'Custom reminder settings'
      ],
      cta: 'Upgrade to Professional',
      ctaVariant: 'upgrade',
      popular: false
    },
    {
      name: 'Enterprise',
      price: { monthly: 'Custom', annual: 'Custom' },
      description: 'Tailored solutions for large enterprises',
      features: [
        'Unlimited contracts',
        'Custom reminder workflows',
        'Advanced user roles & permissions',
        'Dedicated account manager',
        'Custom integrations (coming soon)',
        'White-label options (coming soon)'
      ],
      cta: 'Contact Sales',
      ctaVariant: 'upgrade',
      popular: false
    }
  ];

  const faqs = [
    {
      question: 'What features are currently available?',
      answer: 'All plans include CSV and PDF contract upload, email reminders, search & filtering, contract management dashboard, and CSV export. Team collaboration and audit trails are available in paid plans.'
    },
    {
      question: 'How do email reminders work?',
      answer: 'We automatically send email reminders at 90, 60, and 30 days before contract expiry. Paid plans allow you to customize these reminder intervals in the settings.'
    },
    {
      question: 'Can I export my contract data?',
      answer: 'Yes! You can export your contract list to CSV format at any time. This includes all contract details, dates, and reminder status information.'
    },
    {
      question: 'What file formats do you support?',
      answer: 'We support CSV files for bulk contract uploads and PDF files for individual contract documents. CSV files must follow our template format for proper processing.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes, we use secure authentication and database encryption. Each user can only access their own contract data, ensuring complete privacy and security.'
    },
    {
      question: 'Do you offer team collaboration?',
      answer: 'Yes! Paid plans include team member invitations with role-based permissions. You can invite team members and control their access levels.'
    }
  ];

  const toggleFAQ = (index) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const formatPrice = (price) => {
    if (price === 'Custom') return 'Custom';
    const amount = billingCycle === 'annual' ? price.annual : price.monthly;
    return `$${amount}`;
  };

  const getBillingPeriod = () => {
    return billingCycle === 'annual' ? '/year' : '/month';
  };

  // Helper function to determine if a plan is current
  const isCurrentPlan = (planName) => {
    if (!currentSubscription) {
      return planName === 'Free'; // Default to Free if no subscription
    }
    return currentSubscription.plan_name === planName;
  };

  // Helper function to get plan button text and variant
  const getPlanButton = (plan) => {
    if (isCurrentPlan(plan.name)) {
      return {
        text: 'Current Plan',
        variant: 'current'
      };
    } else if (plan.name === 'Enterprise') {
      return {
        text: 'Contact Sales',
        variant: 'upgrade'
      };
    } else {
      return {
        text: `Upgrade to ${plan.name}`,
        variant: 'upgrade'
      };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Simple, transparent pricing
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
              Choose Your Perfect Plan
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Start free, upgrade anytime. No hidden fees, cancel whenever you want. 
              All plans include our core contract management features.
            </p>
            
            {/* Billing Toggle */}
            <div className="inline-flex items-center bg-gray-100 rounded-lg p-1 mb-8">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  billingCycle === 'annual'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Annual
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Plans */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-8 pb-16">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading subscription data...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative bg-white rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                plan.popular 
                  ? 'border-blue-200 ring-2 ring-blue-100' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-600 text-white shadow-md">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </div>
                </div>
              )}
              
              <div className="p-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">{plan.description}</p>
                  
                  <div className="mb-4">
                    {plan.price === 'Custom' ? (
                      <div className="text-3xl font-bold text-gray-900">Custom</div>
                    ) : (
                      <div className="flex items-baseline justify-center">
                        <span className="text-4xl font-bold text-gray-900">
                          ${billingCycle === 'annual' ? plan.price.annual : plan.price.monthly}
                        </span>
                        <span className="text-gray-600 ml-1 text-sm">{getBillingPeriod()}</span>
                      </div>
                    )}
                  </div>
                  
                  {billingCycle === 'annual' && plan.price !== 'Custom' && (
                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <span>Save ${(plan.price.monthly * 12) - plan.price.annual}/year</span>
                    </div>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <div className="flex-shrink-0 w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                        <Check className="h-2.5 w-2.5 text-green-600" />
                      </div>
                      <span className="text-sm text-gray-700 leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>

                {(() => {
                  const buttonInfo = getPlanButton(plan);
                  
                  // Show Stripe payment links for paid plans (not current and not Enterprise)
                  if (buttonInfo.variant === 'upgrade' && plan.name !== 'Enterprise') {
                    if (plan.name === 'Starter' && billingCycle === 'monthly') {
                      return (
                        <a
                          href="https://buy.stripe.com/cNi00j08M4L62104midAk0c"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-200 bg-gray-900 text-white hover:bg-gray-800 shadow-md hover:shadow-lg text-center block"
                        >
                          {buttonInfo.text}
                        </a>
                      );
                    } else if (plan.name === 'Professional' && billingCycle === 'monthly') {
                      return (
                        <a
                          href="https://buy.stripe.com/5kQ00j4p27XifRQ062dAk0d"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-200 bg-gray-900 text-white hover:bg-gray-800 shadow-md hover:shadow-lg text-center block"
                        >
                          {buttonInfo.text}
                        </a>
                      );
                    }
                  }
                  
                  // Default button for current plans, Enterprise, or plans without Stripe links
                  return (
                    <button
                      className={`w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-200 ${
                        buttonInfo.variant === 'current'
                          ? 'bg-gray-100 text-gray-600 cursor-default border border-gray-200'
                          : 'bg-gray-900 text-white hover:bg-gray-800 shadow-md hover:shadow-lg'
                      }`}
                    >
                      {buttonInfo.text}
                    </button>
                  );
                })()}
              </div>
            </div>
          ))}
          </div>
        )}
      </div>

      {/* Features Comparison */}
      <div className="bg-gradient-to-br from-gray-50 to-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Compare All Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See exactly what's included in each plan to choose the perfect fit for your business
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Features</th>
                    {plans.map((plan) => (
                      <th key={plan.name} className="text-center py-4 px-4 font-semibold text-gray-900">
                        <div className="flex flex-col items-center">
                          <span className="text-sm">{plan.name}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { feature: 'Contract Limit', free: '5', starter: '50', professional: '200', enterprise: 'Unlimited' },
                    { feature: 'Team Members', free: '1', starter: '3', professional: 'Unlimited', enterprise: 'Unlimited' },
                    { feature: 'CSV Upload', free: '✓', starter: '✓', professional: '✓', enterprise: '✓' },
                    { feature: 'PDF Upload', free: '✓', starter: '✓', professional: '✓', enterprise: '✓' },
                    { feature: 'Email Reminders', free: '✓', starter: '✓', professional: '✓', enterprise: '✓' },
                    { feature: 'Custom Reminder Settings', free: '✗', starter: '✓', professional: '✓', enterprise: '✓' },
                    { feature: 'Export to CSV', free: '✓', starter: '✓', professional: '✓', enterprise: '✓' }
                  ].map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6 font-medium text-gray-900">{row.feature}</td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                          row.free === '✓' ? 'bg-green-100 text-green-800' : 
                          row.free === '✗' ? 'bg-red-100 text-red-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {row.free}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                          row.starter === '✓' ? 'bg-green-100 text-green-800' : 
                          row.starter === '✗' ? 'bg-red-100 text-red-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {row.starter}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                          row.professional === '✓' ? 'bg-green-100 text-green-800' : 
                          row.professional === '✗' ? 'bg-red-100 text-red-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {row.professional}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                          row.enterprise === '✓' ? 'bg-green-100 text-green-800' : 
                          row.enterprise === '✗' ? 'bg-red-100 text-red-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {row.enterprise}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Elements */}
      <div className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Built for MSPs
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A contract management solution designed specifically for managed service providers to streamline renewals and never miss deadlines
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-xl border border-blue-200">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Secure & Private</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Your contract data is encrypted and secure. Each user can only access their own contracts with proper authentication.</p>
            </div>
            
            <div className="text-center p-6 bg-green-50 rounded-xl border border-green-200">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Team Collaboration</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Invite team members and manage permissions. Perfect for MSPs who need multiple people to track contracts.</p>
            </div>
            
            <div className="text-center p-6 bg-purple-50 rounded-xl border border-purple-200">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Award className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Easy to Use</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Simple CSV upload, automatic reminders, and intuitive dashboard. Get started in minutes, not hours.</p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gradient-to-br from-gray-50 to-white py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about our pricing and plans
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors rounded-lg"
                >
                  <span className="font-semibold text-gray-900">{faq.question}</span>
                  {expandedFAQ === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                {expandedFAQ === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 py-20">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Streamline Your Contract Management?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            Start tracking your contract renewals today with automated reminders, team collaboration, and comprehensive reporting.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              to="/app/dashboard"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-xl hover:shadow-2xl hover:-translate-y-1"
            >
              Get Started
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <button className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white text-lg font-semibold rounded-xl hover:bg-white hover:text-blue-600 transition-all duration-200">
              Contact Sales
            </button>
          </div>
          <p className="mt-6 text-blue-200 text-sm">
            No credit card required • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}

export default PlansPage;
