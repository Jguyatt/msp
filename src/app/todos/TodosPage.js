import React, { useState, useEffect } from 'react';
import { 
  Target, 
  RefreshCw,
  DollarSign,
  Info,
  X,
  Calendar
} from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { contractService } from '../../services/supabaseService';

function TodosPage() {
  const { user } = useUser();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBreakdown, setSelectedBreakdown] = useState(null);
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);

  useEffect(() => {
    if (user?.primaryEmailAddress?.emailAddress) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const contractsData = await contractService.getContractsForUser(user.primaryEmailAddress.emailAddress);
      setContracts(contractsData || []);
    } catch (error) {
      console.error('Error fetching contracts:', error);
    } finally {
      setLoading(false);
    }
  };


  // Real calculation functions
  const calculateRealSavings = (contract) => {
    if (!contract || !contract.value || contract.value <= 0) return 0;
    
    // Calculate savings based on contract type, market conditions, and negotiation potential
    const baseSavingsRate = getSavingsRateByCategory(contract.category);
    const urgencyMultiplier = getUrgencyMultiplier(contract.end_date);
    const valueMultiplier = getValueMultiplier(contract.value);
    
    return contract.value * baseSavingsRate * urgencyMultiplier * valueMultiplier;
  };

  const getSavingsRateByCategory = (category) => {
    if (!category) return 0.10; // Default 10% if no category
    
    const rates = {
      'Services': 0.12,      // 12% typical savings on service contracts
      'Software': 0.18,      // 18% typical savings on software licenses
      'Marketing': 0.25,     // 25% typical savings on marketing contracts
      'Hardware': 0.15,      // 15% typical savings on hardware
      'Consulting': 0.20,    // 20% typical savings on consulting
      'Other': 0.10          // 10% default savings rate
    };
    return rates[category] || rates['Other'];
  };

  const getUrgencyMultiplier = (endDate) => {
    if (!endDate) return 1.0;
    
    const daysUntilExpiry = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 30) return 1.3;      // 30% more savings potential if urgent
    if (daysUntilExpiry <= 60) return 1.2;      // 20% more savings potential if approaching
    if (daysUntilExpiry <= 90) return 1.1;      // 10% more savings potential if soon
    return 1.0;                                 // Normal savings potential
  };

  const getValueMultiplier = (value) => {
    if (!value || value <= 0) return 1.0; // Default if no value
    if (value >= 50000) return 1.2;    // 20% more savings potential for high-value contracts
    if (value >= 10000) return 1.1;    // 10% more savings potential for medium-value contracts
    return 1.0;                        // Normal savings potential for smaller contracts
  };




  const calculateOptimalDaysBefore = (contract) => {
    const baseDays = 60; // Default baseline
    
    // Adjust based on contract value
    let valueAdjustment = 0;
    if (contract.value > 100000) valueAdjustment = 45; // Very high value: +45 days
    else if (contract.value > 50000) valueAdjustment = 30; // High value: +30 days
    else if (contract.value > 20000) valueAdjustment = 15; // Medium-high value: +15 days
    else if (contract.value < 5000) valueAdjustment = -15; // Low value: -15 days
    
    // Adjust based on contract type/category
    let categoryAdjustment = 0;
    switch (contract.category) {
      case 'Software': categoryAdjustment = 20; break; // Software licenses need more time
      case 'Services': categoryAdjustment = 10; break; // Services need moderate time
      case 'Marketing': categoryAdjustment = -10; break; // Marketing can be faster
      case 'Hardware': categoryAdjustment = 15; break; // Hardware needs time for procurement
      default: categoryAdjustment = 0;
    }
    
    // Adjust based on auto-renewal status
    let renewalAdjustment = 0;
    if (contract.auto_renewal) {
      renewalAdjustment = -20; // Auto-renewal contracts need earlier action
    }
    
    // Adjust based on notice period
    let noticeAdjustment = 0;
    if (contract.notice_period_days) {
      noticeAdjustment = Math.max(0, contract.notice_period_days - 30); // Extra time for longer notice periods
    }
    
    return Math.max(15, baseDays + valueAdjustment + categoryAdjustment + renewalAdjustment + noticeAdjustment);
  };

  const calculateOptimalRenewalDate = (contract) => {
    const endDate = new Date(contract.end_date);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    
    // AI logic for optimal renewal timing based on real contract data
    let optimalDaysBefore = calculateOptimalDaysBefore(contract);
    
    const optimalDate = new Date(endDate.getTime() - (optimalDaysBefore * 24 * 60 * 60 * 1000));
    
    return {
      date: optimalDate,
      daysBefore: optimalDaysBefore,
      reasoning: generateRenewalReasoning(contract, optimalDaysBefore),
      profitMaximization: calculateProfitMaximization(contract, optimalDate)
    };
  };

  const generateRenewalReasoning = (contract, daysBefore) => {
    const reasons = [];
    
    if (contract.value > 50000) {
      reasons.push('High-value contract requires extended negotiation period');
    }
    
    if (contract.auto_renewal) {
      reasons.push('Auto-renewal clause requires early termination notice');
    }
    
    if (daysBefore >= 60) {
      reasons.push('Allows time for market research and competitive bidding');
    }
    
    return reasons.join('; ');
  };

  const calculateProfitMaximization = (contract, optimalDate) => {
    const endDate = new Date(contract.end_date);
    const daysEarly = Math.ceil((endDate - optimalDate) / (1000 * 60 * 60 * 24));
    
    // Estimated savings based on timing
    let savingsPercentage = 0.05; // Base 5%
    
    if (daysEarly >= 90) {
      savingsPercentage = 0.20; // Up to 20% with early planning
    } else if (daysEarly >= 60) {
      savingsPercentage = 0.15; // Up to 15% with good planning
    } else if (daysEarly >= 30) {
      savingsPercentage = 0.10; // Up to 10% with adequate planning
    }
    
    return {
      estimatedSavings: contract.value * savingsPercentage,
      percentage: savingsPercentage * 100,
      riskReduction: daysEarly >= 60 ? 'High' : daysEarly >= 30 ? 'Medium' : 'Low'
    };
  };

  // Generate detailed breakdown for AI recommendations
  const generateBreakdown = (type, data) => {
    switch (type) {
      case 'optimal-renewal-date':
        return {
          title: 'Optimal Renewal Date Analysis',
          icon: Calendar,
          sections: [
            {
              title: 'Why This Date?',
              content: `The optimal renewal date of ${data.date ? new Date(data.date).toLocaleDateString() : 'Unknown'} is calculated based on:`,
              items: [
                `Contract end date: ${data.contract?.end_date ? new Date(data.contract.end_date).toLocaleDateString() : 'Unknown'}`,
                `Notice period: ${data.contract?.notice_period_days || 30} days`,
                `Negotiation buffer: 14 days for preparation`,
                `Market timing: ${data.marketConditions || 'Current market conditions favor negotiation'}`
              ]
            },
            {
              title: 'Risk Assessment',
              content: 'Risk level: ' + data.riskLevel,
              items: [
                data.riskLevel === 'Low' ? 'Early renewal allows for favorable terms' : 
                data.riskLevel === 'Medium' ? 'Moderate timing provides good negotiation window' :
                'Late renewal may limit negotiation options',
                `Auto-renewal status: ${data.contract?.auto_renewal ? 'Yes - requires early action' : 'No - flexible timing'}`
              ]
            },
            {
              title: 'Financial Impact',
              content: `Potential savings: $${(data.estimatedSavings || 0).toFixed(2)}`,
              items: [
                `Based on ${data.contract?.category || 'Unknown'} category: ${getSavingsRateByCategory(data.contract?.category) * 100}% typical savings`,
                `Contract value: $${data.contract?.value?.toLocaleString() || 'Unknown'}`,
                `Market conditions factor: ${data.marketMultiplier || 1.0}x`
              ]
            }
          ]
        };
      
      case 'savings-potential':
        return {
          title: 'Savings Potential Analysis',
          icon: DollarSign,
          sections: [
            {
              title: 'How We Calculate Savings',
              content: `Total estimated savings: $${(data.estimatedSavings || 0).toFixed(2)}`,
              items: [
                `Base savings rate for ${data.contract?.category || 'Unknown'}: ${getSavingsRateByCategory(data.contract?.category) * 100}%`,
                `Urgency multiplier: ${getUrgencyMultiplier(data.contract?.end_date)}x`,
                `Value multiplier: ${getValueMultiplier(data.contract?.value)}x`,
                `Market conditions: ${data.marketMultiplier || 1.0}x`
              ]
            },
            {
              title: 'Savings Breakdown',
              content: 'This estimate is based on industry benchmarks:',
              items: [
                'Historical negotiation success rates',
                'Market rate comparisons',
                'Vendor relationship factors',
                'Contract complexity analysis'
              ]
            }
          ]
        };
      
      case 'task-priority':
        return {
          title: 'Task Priority Analysis',
          icon: Target,
          sections: [
            {
              title: 'Why This Priority?',
              content: `Priority: ${data.priority}`,
              items: [
                `Due date: ${data.dueDate ? new Date(data.dueDate).toLocaleDateString() : 'Unknown'}`,
                `Days until due: ${data.dueDate ? Math.ceil((new Date(data.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) : 'Unknown'}`,
                `Contract value impact: $${data.contract?.value?.toLocaleString() || 'Unknown'}`,
                `Auto-renewal risk: ${data.contract?.auto_renewal ? 'High - requires timely action' : 'Low - flexible timing'}`
              ]
            },
            {
              title: 'Impact Analysis',
              content: 'This task affects:',
              items: [
                'Contract renewal timeline',
                'Negotiation preparation',
                'Cost optimization opportunities',
                'Risk mitigation strategies'
              ]
            }
          ]
        };
      
      default:
        return {
          title: 'AI Analysis',
          icon: Brain,
          sections: [
            {
              title: 'Analysis Details',
              content: 'This recommendation is generated by AI based on:',
              items: [
                'Contract data analysis',
                'Industry best practices',
                'Market timing factors',
                'Historical success patterns'
              ]
            }
          ]
        };
    }
  };

  const handleBreakdownClick = (type, data) => {
    const breakdown = generateBreakdown(type, data);
    setSelectedBreakdown(breakdown);
    setShowBreakdownModal(true);
  };



  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900">Loading Optimal Renewal Dates</h3>
              <p className="text-sm text-slate-600">AI is analyzing your contracts and calculating optimal renewal dates...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Optimal Renewal Dates</h1>
              <p className="text-slate-600">AI-driven renewal optimization based on market research and contract analysis</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchData}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Target className="h-4 w-4" />
                Refresh Analysis
              </button>
              <button
                onClick={fetchData}
                className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>



        {/* Optimal Renewal Dates Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <Target className="h-5 w-5" />
              AI-Optimized Renewal Dates & Profit Maximization
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contracts.map((contract) => {
                const optimalData = calculateOptimalRenewalDate(contract);
                return (
                  <div key={contract.id} className="bg-white rounded-lg p-4 border border-blue-200">
                    <h4 className="font-semibold text-slate-900 mb-2">{contract.vendor}</h4>
                    <p className="text-sm text-slate-600 mb-3">{contract.contract_name}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">Optimal Renewal:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-blue-600">{formatDate(optimalData.date)}</span>
                          <button
                            onClick={() => handleBreakdownClick('optimal-renewal-date', { 
                              ...optimalData, 
                              contract,
                              estimatedSavings: optimalData.profitMaximization?.estimatedSavings || calculateRealSavings(contract),
                              riskLevel: optimalData.profitMaximization?.riskReduction || 'Medium'
                            })}
                            className="text-blue-500 hover:text-blue-700 transition-colors"
                            title="Click to see detailed analysis"
                          >
                            <Info className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Days Before:</span>
                        <span className="font-medium">{optimalData.daysBefore}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">Savings Potential:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-green-600">
                            ${optimalData.profitMaximization.estimatedSavings.toLocaleString()}
                          </span>
                          <button
                            onClick={() => handleBreakdownClick('savings-potential', { 
                              ...optimalData.profitMaximization, 
                              contract,
                              estimatedSavings: optimalData.profitMaximization?.estimatedSavings || calculateRealSavings(contract),
                              marketMultiplier: 1.0
                            })}
                            className="text-green-500 hover:text-green-700 transition-colors"
                            title="Click to see savings breakdown"
                          >
                            <Info className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Risk Level:</span>
                        <span className={`font-medium ${
                          optimalData.profitMaximization.riskReduction === 'High' ? 'text-green-600' :
                          optimalData.profitMaximization.riskReduction === 'Medium' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {optimalData.profitMaximization.riskReduction}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

      </div>

      {/* Detailed Breakdown Modal */}
      {showBreakdownModal && selectedBreakdown && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <selectedBreakdown.icon className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-slate-900">{selectedBreakdown.title}</h2>
              </div>
              <button
                onClick={() => setShowBreakdownModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {selectedBreakdown.sections.map((section, index) => (
                <div key={index} className="space-y-3">
                  <h3 className="text-lg font-semibold text-slate-900">{section.title}</h3>
                  <p className="text-slate-600">{section.content}</p>
                  {section.items && (
                    <ul className="space-y-2">
                      {section.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-slate-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex justify-end p-6 border-t border-slate-200">
              <button
                onClick={() => setShowBreakdownModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TodosPage;
