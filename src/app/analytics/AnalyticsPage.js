import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  BarChart3, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  DollarSign,
  Calendar,
  Users
} from 'lucide-react';
import DecisionDashboard from '../components/DecisionDashboard';
import { AnalyticsEmptyState } from '../components/EmptyStates';
import decisionAnalyticsService from '../../services/decisionAnalyticsService';
import { useUserSync } from '../../hooks/useUserSync';
import { contractService } from '../../services/supabaseService';

function AnalyticsPage() {
  const navigate = useNavigate();
  const { clerkUser, supabaseUser, loading: userLoading } = useUserSync();
  const [contracts, setContracts] = useState([]);
  const [analyticsSummary, setAnalyticsSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadContractsAndAnalytics();
  }, [clerkUser, supabaseUser, userLoading]);

  const loadContractsAndAnalytics = async () => {
    console.log('AnalyticsPage: Loading contracts - userLoading:', userLoading, 'clerkUser:', !!clerkUser, 'supabaseUser:', !!supabaseUser);
    
    if (userLoading || !clerkUser || !supabaseUser) {
      console.log('AnalyticsPage: Skipping load - user not ready');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      console.log('AnalyticsPage: Fetching contracts for user:', clerkUser.emailAddresses[0].emailAddress);
      
      // Load real contracts from Supabase
      const realContracts = await contractService.getContractsForUser(clerkUser.emailAddresses[0].emailAddress);
      console.log('AnalyticsPage: Real contracts loaded:', realContracts);
      
      // Transform contract data to analytics format
      const transformedContracts = realContracts.map(contract => ({
        id: contract.id,
        name: contract.contract_name || 'Unnamed Contract',
        category: contract.category || 'general',
        value: contract.contract_value || contract.value || 0,
        contract_value: contract.contract_value || contract.value || 0, // Keep both for compatibility
        renewalDate: contract.end_date,
        status: 'active',
        vendor: contract.vendor_name || 'Unknown Vendor',
        hasPenaltyClause: contract.has_penalty_clause || false,
        autoRenewal: contract.auto_renewal || false,
        auto_renewal: contract.auto_renewal || false, // Keep both for compatibility
        vendorCompetition: contract.vendor_competition || 'medium',
        marketTrend: contract.market_trend || 'stable',
        negotiationHistory: contract.negotiation_history || [],
        daysUntil: contract.daysUntil || 0
      }));
      
      setContracts(transformedContracts);

      // Get analytics summary
      const summaryResult = await decisionAnalyticsService.getAnalyticsSummary(transformedContracts);
      if (summaryResult.success) {
        setAnalyticsSummary(summaryResult.data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };


  const handleScenarioSelect = (scenario, analysis) => {
    console.log('Scenario selected:', scenario, analysis);
    // You can add additional logic here, such as:
    // - Logging the analysis
    // - Saving results to database
    // - Triggering notifications
    // - Updating contract records
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100/80 backdrop-blur-xl mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Loading Analytics</h3>
          <p className="text-slate-600">Preparing your contract intelligence dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-white/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/contracts')}
                className="p-2 rounded-lg bg-white/80 backdrop-blur-xl border border-white/30 hover:bg-white/90 transition-all duration-300 mr-4"
              >
                <ArrowLeft className="h-5 w-5 text-slate-600" />
              </button>
              <div className="flex items-center">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-200/30 mr-3">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Contract Analytics</h1>
                  <p className="text-sm text-slate-600">AI-powered decision intelligence</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-slate-600">
                {contracts.length} contracts analyzed
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Summary */}
      {analyticsSummary && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid gap-6 lg:grid-cols-4 mb-8">
            <div className="bg-white/90 backdrop-blur-xl p-6 rounded-2xl border-2 border-white/40 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-200/30">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {analyticsSummary.totalContracts}
                </div>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Total Contracts</h3>
              <p className="text-sm text-slate-600">Active contracts in portfolio</p>
            </div>

            <div className="bg-white/90 backdrop-blur-xl p-6 rounded-2xl border-2 border-white/40 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-200/30">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  ${analyticsSummary.totalValue.toLocaleString()}
                </div>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Total Value</h3>
              <p className="text-sm text-slate-600">Combined contract value</p>
            </div>

            <div className="bg-white/90 backdrop-blur-xl p-6 rounded-2xl border-2 border-white/40 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-200/30">
                  <Calendar className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {analyticsSummary.upcomingRenewals}
                </div>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Upcoming Renewals</h3>
              <p className="text-sm text-slate-600">Next 90 days</p>
            </div>

            <div className="bg-white/90 backdrop-blur-xl p-6 rounded-2xl border-2 border-white/40 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-200/30">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {analyticsSummary.savingsOpportunities}
                </div>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Savings Opportunities</h3>
              <p className="text-sm text-slate-600">Contracts with optimization potential</p>
            </div>
          </div>
        </div>
      )}

      {/* Decision Dashboard or Empty State */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {contracts.length === 0 ? (
          <AnalyticsEmptyState
            onUpload={() => navigate('/app/contracts')}
            onViewContracts={() => navigate('/app/contracts')}
          />
        ) : (
          <DecisionDashboard 
            contracts={contracts}
            onScenarioSelect={handleScenarioSelect}
          />
        )}
      </div>
    </div>
  );
}

export default AnalyticsPage;
