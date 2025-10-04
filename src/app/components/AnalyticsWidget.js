import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  DollarSign,
  Calendar,
  ArrowRight,
  Zap
} from 'lucide-react';
import decisionAnalyticsService from '../../services/decisionAnalyticsService';

function AnalyticsWidget({ contracts = [] }) {
  const navigate = useNavigate();
  const [analyticsSummary, setAnalyticsSummary] = useState(null);
  const [quickInsights, setQuickInsights] = useState([]);

  useEffect(() => {
    loadQuickAnalytics();
  }, [contracts]);

  const loadQuickAnalytics = async () => {
    try {
      const summaryResult = await decisionAnalyticsService.getAnalyticsSummary(contracts);
      if (summaryResult.success) {
        setAnalyticsSummary(summaryResult.data);
      }

      // Generate quick insights
      const insights = generateQuickInsights(contracts);
      setQuickInsights(insights);
    } catch (error) {
      console.error('Error loading quick analytics:', error);
    }
  };

  const generateQuickInsights = (contracts) => {
    const insights = [];
    
    // Check for upcoming renewals using real contract data
    const upcomingRenewals = contracts.filter(contract => {
      // Use daysUntil if available, otherwise calculate from renewalDate
      if (contract.daysUntil !== undefined) {
        return contract.daysUntil <= 30 && contract.daysUntil > 0;
      }
      
      if (contract.renewalDate) {
        const renewalDate = new Date(contract.renewalDate);
        const now = new Date();
        const daysUntilRenewal = Math.ceil((renewalDate - now) / (1000 * 60 * 60 * 24));
        return daysUntilRenewal <= 30 && daysUntilRenewal > 0;
      }
      
      return false;
    });

    if (upcomingRenewals.length > 0) {
      insights.push({
        type: 'warning',
        icon: AlertTriangle,
        title: `${upcomingRenewals.length} contracts renewing soon`,
        description: 'Contracts expiring in the next 30 days need attention',
        action: 'Review Renewals'
      });
    }

    // Check for high-value contracts (adjust threshold based on your data)
    const highValueContracts = contracts.filter(contract => contract.value > 50000);
    if (highValueContracts.length > 0) {
      const totalValue = highValueContracts.reduce((sum, c) => sum + (c.value || 0), 0);
      insights.push({
        type: 'opportunity',
        icon: DollarSign,
        title: `${highValueContracts.length} high-value contracts`,
        description: `Total value: $${totalValue.toLocaleString()}`,
        action: 'Analyze Savings'
      });
    }

    // Check for savings opportunities using real contract data
    const savingsOpportunities = contracts.filter(contract => {
      // Check if contract has characteristics that suggest savings potential
      const hasValue = contract.value && contract.value > 10000;
      const hasCategory = contract.category && ['software', 'cloud', 'services'].includes(contract.category);
      const isActive = contract.status === 'active';
      
      return hasValue && hasCategory && isActive;
    });
    
    if (savingsOpportunities.length > 0) {
      insights.push({
        type: 'success',
        icon: TrendingUp,
        title: `${savingsOpportunities.length} savings opportunities`,
        description: 'Contracts identified for cost optimization',
        action: 'View Analysis'
      });
    }

    return insights.slice(0, 2); // Show max 2 insights
  };

  const getInsightColor = (type) => {
    switch (type) {
      case 'warning': return 'border-yellow-200 bg-yellow-50/80';
      case 'opportunity': return 'border-blue-200 bg-blue-50/80';
      case 'success': return 'border-green-200 bg-green-50/80';
      default: return 'border-slate-200 bg-slate-50/80';
    }
  };

  const getInsightIconColor = (type) => {
    switch (type) {
      case 'warning': return 'text-yellow-600';
      case 'opportunity': return 'text-blue-600';
      case 'success': return 'text-green-600';
      default: return 'text-slate-600';
    }
  };

  if (!analyticsSummary) {
    return (
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/40 shadow-lg">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 border-2 border-white/40 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-200/30 mr-3">
            <BarChart3 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Contract Analytics</h3>
            <p className="text-sm text-slate-600">AI-powered insights</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/app/analytics')}
          className="p-2 rounded-lg bg-blue-100/80 backdrop-blur-sm text-blue-600 hover:bg-blue-200/80 transition-all duration-300"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900">
            {analyticsSummary.totalContracts}
          </div>
          <div className="text-sm text-slate-600">Total Contracts</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900">
            ${analyticsSummary.totalValue.toLocaleString()}
          </div>
          <div className="text-sm text-slate-600">Total Value</div>
        </div>
      </div>

      {/* Quick Insights */}
      <div className="space-y-3">
        {quickInsights.map((insight, index) => {
          const IconComponent = insight.icon;
          return (
            <div
              key={index}
              className={`p-3 rounded-xl border backdrop-blur-sm ${getInsightColor(insight.type)}`}
            >
              <div className="flex items-center">
                <IconComponent className={`h-5 w-5 mr-3 ${getInsightIconColor(insight.type)}`} />
                <div className="flex-1">
                  <div className="font-semibold text-slate-900 text-sm">
                    {insight.title}
                  </div>
                  <div className="text-xs text-slate-600">
                    {insight.description}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Button */}
      <div className="mt-6">
        <button
          onClick={() => navigate('/app/analytics')}
          className="w-full bg-slate-800/80 backdrop-blur-xl text-white font-semibold py-3 px-4 rounded-xl border border-slate-700/30 hover:bg-slate-800/90 hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
        >
          <Zap className="h-4 w-4 mr-2 text-slate-200 group-hover:text-white transition-colors" />
          Run AI Analysis
        </button>
      </div>
    </div>
  );
}

export default AnalyticsWidget;
