import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Target,
  Zap
} from 'lucide-react';

function DecisionDashboard({ contracts = [], onScenarioSelect }) {
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);

  // Sample scenarios for demonstration
  const defaultScenarios = [
    {
      id: 'delay-renewal',
      title: 'Delay Renewal Analysis',
      description: 'Analyze cost impact of delaying contract renewals',
      icon: Clock,
      type: 'renewal-delay',
      parameters: {
        delayDays: 30,
        contracts: contracts.slice(0, 5)
      }
    },
    {
      id: 'savings-potential',
      title: 'Savings Potential Analysis',
      description: 'Identify contracts with highest savings opportunities',
      icon: TrendingUp,
      type: 'savings-analysis',
      parameters: {
        timeframe: 'quarter',
        topCount: 3
      }
    },
    {
      id: 'cost-optimization',
      title: 'Cost Optimization',
      description: 'Find opportunities to reduce contract costs',
      icon: Target,
      type: 'cost-optimization',
      parameters: {
        reductionTarget: 15
      }
    }
  ];

  useEffect(() => {
    setScenarios(defaultScenarios);
  }, [contracts]);

  const runScenarioAnalysis = async (scenario) => {
    setIsLoading(true);
    setSelectedScenario(scenario);
    
    // Simulate AI analysis with realistic data
    const mockAnalysis = await simulateAIAnalysis(scenario);
    setAnalysisResults(mockAnalysis);
    setIsLoading(false);
    
    if (onScenarioSelect) {
      onScenarioSelect(scenario, mockAnalysis);
    }
  };

  const calculateRealAnalytics = (contracts, scenario) => {
    if (!contracts || contracts.length === 0) {
      return {
        renewalDelay: {
          title: 'No Contract Data Available',
          summary: 'Upload contracts to see renewal delay analysis',
          insights: [],
          recommendations: ['Upload contract data to get started'],
          financialImpact: {
            potentialSavings: '$0',
            riskExposure: '$0',
            netImpact: '$0'
          }
        }
      };
    }

    // Calculate real financial impact based on actual contract data
    const totalContractValue = contracts.reduce((sum, contract) => {
      const value = contract.value || contract.contract_value || 0;
      return sum + value;
    }, 0);
    const highValueContracts = contracts.filter(c => {
      const value = c.value || c.contract_value || 0;
      return value > 1000;
    });
    const autoRenewalContracts = contracts.filter(c => c.auto_renewal === true || c.autoRenewal === true);
    const marketingContracts = contracts.filter(c => c.category === 'Marketing');
    const servicesContracts = contracts.filter(c => c.category === 'Services');

    // Calculate potential savings based on real contract categories and values
    const potentialSavings = calculatePotentialSavings(contracts);
    const riskExposure = calculateRiskExposure(contracts);
    const netImpact = potentialSavings - riskExposure;

    // Generate real insights based on actual contract data
    const insights = generateRealInsights(contracts);
    const recommendations = generateRealRecommendations(contracts);

    return {
      renewalDelay: {
        title: 'Renewal Delay Impact Analysis',
        summary: `Analysis of ${contracts.length} contracts with total value of $${totalContractValue.toLocaleString()}`,
        insights: insights,
        recommendations: recommendations,
        financialImpact: {
          potentialSavings: `$${potentialSavings.toLocaleString()}`,
          riskExposure: `$${riskExposure.toLocaleString()}`,
          netImpact: `$${netImpact.toLocaleString()}`
        },
        detailedExplanations: {
          savings: getSavingsExplanation(contracts),
          risks: getRiskExplanation(contracts)
        }
      },
      savingsAnalysis: {
        title: 'Top Savings Opportunities',
        summary: `Identified ${contracts.length} contracts with savings potential`,
        insights: generateSavingsInsights(contracts),
        recommendations: recommendations,
        financialImpact: {
          potentialSavings: `$${potentialSavings.toLocaleString()}`,
          riskExposure: `$${riskExposure.toLocaleString()}`,
          netImpact: `$${netImpact.toLocaleString()}`
        },
        detailedExplanations: {
          savings: getSavingsExplanation(contracts),
          risks: getRiskExplanation(contracts)
        }
      }
    };
  };

  const calculatePotentialSavings = (contracts) => {
    return contracts.reduce((total, contract) => {
      const value = contract.value || contract.contract_value || 0;
      if (!value) return total;
      
      // Calculate savings based on contract category
      let savingsRate = 0.10; // Default 10%
      switch (contract.category) {
        case 'Marketing': savingsRate = 0.25; break; // 25% for marketing
        case 'Services': savingsRate = 0.12; break;  // 12% for services
        case 'Software': savingsRate = 0.18; break;  // 18% for software
        case 'Hardware': savingsRate = 0.15; break;  // 15% for hardware
      }
      
      // Higher value contracts have more negotiation potential
      if (value > 5000) savingsRate *= 1.2;
      if (value > 10000) savingsRate *= 1.3;
      
      return total + (value * savingsRate);
    }, 0);
  };

  const getSavingsExplanation = (contracts) => {
    const explanations = [];
    
    contracts.forEach(contract => {
      const value = contract.value || contract.contract_value || 0;
      if (!value) return;
      
      let savingsRate = 0.10;
      let categoryExplanation = "General contracts typically have 10% savings potential through competitive bidding and negotiation.";
      
      switch (contract.category) {
        case 'Marketing':
          savingsRate = 0.25;
          categoryExplanation = "Marketing contracts have 25% savings potential due to high vendor competition and seasonal pricing variations.";
          break;
        case 'Services':
          savingsRate = 0.12;
          categoryExplanation = "Service contracts offer 12% savings through scope optimization and vendor consolidation.";
          break;
        case 'Software':
          savingsRate = 0.18;
          categoryExplanation = "Software contracts provide 18% savings potential through license optimization and volume discounts.";
          break;
        case 'Hardware':
          savingsRate = 0.15;
          categoryExplanation = "Hardware contracts have 15% savings potential through competitive procurement and bulk purchasing.";
          break;
      }
      
      // Apply value multipliers
      let valueMultiplier = 1;
      let valueExplanation = "";
      if (value > 10000) {
        valueMultiplier = 1.3;
        valueExplanation = "High-value contracts (>$10K) have 30% more negotiation leverage due to vendor relationship value.";
      } else if (value > 5000) {
        valueMultiplier = 1.2;
        valueExplanation = "Medium-value contracts (>$5K) have 20% more negotiation leverage through volume discounts.";
      }
      
      const finalSavingsRate = savingsRate * valueMultiplier;
      const potentialSavings = value * finalSavingsRate;
      
      explanations.push({
        contractName: contract.contract_name || contract.name || 'Unnamed Contract',
        contractValue: value,
        category: contract.category || 'General',
        savingsRate: finalSavingsRate,
        potentialSavings: potentialSavings,
        categoryExplanation,
        valueExplanation,
        actions: getSavingsActions(contract.category, value)
      });
    });
    
    return explanations;
  };

  const getSavingsActions = (category, value) => {
    const actions = [];
    
    switch (category) {
      case 'Marketing':
        actions.push(
          "Request competitive bids from 3+ marketing agencies",
          "Negotiate performance-based pricing models",
          "Consolidate marketing tools to reduce vendor count",
          "Leverage seasonal pricing for campaign timing"
        );
        break;
      case 'Services':
        actions.push(
          "Define clear service level agreements (SLAs)",
          "Negotiate volume discounts for bundled services",
          "Consider outsourcing vs. in-house alternatives",
          "Request fixed-price contracts vs. hourly billing"
        );
        break;
      case 'Software':
        actions.push(
          "Audit current license usage and optimize seat count",
          "Negotiate multi-year contracts for better rates",
          "Request feature-based pricing vs. all-inclusive plans",
          "Explore vendor consolidation opportunities"
        );
        break;
      case 'Hardware':
        actions.push(
          "Request competitive quotes from multiple vendors",
          "Negotiate bulk purchase discounts",
          "Consider leasing vs. purchasing options",
          "Request extended warranty and support packages"
        );
        break;
      default:
        actions.push(
          "Conduct market research for competitive pricing",
          "Negotiate payment terms and contract length",
          "Request volume discounts and loyalty benefits",
          "Consider alternative vendors for comparison"
        );
    }
    
    if (value > 10000) {
      actions.push("Leverage high-value relationship for executive-level negotiations");
    } else if (value > 5000) {
      actions.push("Request dedicated account management and priority support");
    }
    
    return actions;
  };

  const calculateRiskExposure = (contracts) => {
    return contracts.reduce((total, contract) => {
      const value = contract.value || contract.contract_value || 0;
      if (!value) return total;
      
      // Calculate risk based on auto-renewal and contract type
      let riskRate = 0.05; // Default 5% risk
      
      if (contract.auto_renewal || contract.autoRenewal) {
        riskRate = 0.15; // 15% risk for auto-renewal contracts
      }
      
      // Marketing contracts have higher volatility
      if (contract.category === 'Marketing') {
        riskRate = 0.20; // 20% risk for marketing contracts
      }
      
      return total + (value * riskRate);
    }, 0);
  };

  const getRiskExplanation = (contracts) => {
    const explanations = [];
    
    contracts.forEach(contract => {
      const value = contract.value || contract.contract_value || 0;
      if (!value) return;
      
      let riskRate = 0.05;
      let riskExplanation = "Standard contracts have 5% risk exposure from market fluctuations and vendor changes.";
      
      if (contract.auto_renewal || contract.autoRenewal) {
        riskRate = 0.15;
        riskExplanation = "Auto-renewal contracts have 15% risk exposure due to automatic price increases and lack of negotiation opportunities.";
      }
      
      if (contract.category === 'Marketing') {
        riskRate = 0.20;
        riskExplanation = "Marketing contracts have 20% risk exposure due to campaign performance volatility and seasonal demand changes.";
      }
      
      const riskExposure = value * riskRate;
      
      explanations.push({
        contractName: contract.contract_name || contract.name || 'Unnamed Contract',
        contractValue: value,
        category: contract.category || 'General',
        riskRate: riskRate,
        riskExposure: riskExposure,
        riskExplanation,
        riskFactors: getRiskFactors(contract),
        mitigationActions: getMitigationActions(contract)
      });
    });
    
    return explanations;
  };

  const getRiskFactors = (contract) => {
    const factors = [];
    
    if (contract.auto_renewal || contract.autoRenewal) {
      factors.push("Automatic renewal without price review");
      factors.push("Potential for unexpected rate increases");
      factors.push("Limited negotiation window");
    }
    
    switch (contract.category) {
      case 'Marketing':
        factors.push("Campaign performance variability");
        factors.push("Seasonal demand fluctuations");
        factors.push("Vendor dependency on creative quality");
        break;
      case 'Services':
        factors.push("Service delivery quality variations");
        factors.push("Resource availability constraints");
        factors.push("Scope creep potential");
        break;
      case 'Software':
        factors.push("Technology obsolescence risk");
        factors.push("Vendor lock-in concerns");
        factors.push("License compliance issues");
        break;
      case 'Hardware':
        factors.push("Equipment failure and maintenance costs");
        factors.push("Technology advancement depreciation");
        factors.push("Supply chain disruptions");
        break;
    }
    
    return factors;
  };

  const getMitigationActions = (contract) => {
    const actions = [];
    
    if (contract.auto_renewal || contract.autoRenewal) {
      actions.push("Disable auto-renewal and set manual review dates");
      actions.push("Negotiate price protection clauses");
      actions.push("Establish 90-day notice requirements");
    }
    
    switch (contract.category) {
      case 'Marketing':
        actions.push("Implement performance-based pricing models");
        actions.push("Diversify across multiple marketing vendors");
        actions.push("Establish clear ROI measurement criteria");
        break;
      case 'Services':
        actions.push("Define detailed service level agreements");
        actions.push("Implement regular vendor performance reviews");
        actions.push("Maintain backup vendor relationships");
        break;
      case 'Software':
        actions.push("Negotiate data portability clauses");
        actions.push("Request multi-vendor integration options");
        actions.push("Establish technology roadmap alignment");
        break;
      case 'Hardware':
        actions.push("Negotiate comprehensive warranty coverage");
        actions.push("Establish equipment refresh schedules");
        actions.push("Request vendor maintenance guarantees");
        break;
    }
    
    return actions;
  };

  const generateRealInsights = (contracts) => {
    const insights = [];
    
    const highValueContracts = contracts.filter(c => {
      const value = c.value || c.contract_value || 0;
      return value > 1000;
    });
    const autoRenewalContracts = contracts.filter(c => c.auto_renewal === true || c.autoRenewal === true);
    const marketingContracts = contracts.filter(c => c.category === 'Marketing');
    
    if (highValueContracts.length > 0) {
      insights.push({
        type: 'warning',
        title: 'High Value Contracts',
        description: `${highValueContracts.length} contract${highValueContracts.length > 1 ? 's' : ''} with value over $1,000 require careful monitoring`,
        impact: 'high'
      });
    }
    
    if (autoRenewalContracts.length > 0) {
      insights.push({
        type: 'opportunity',
        title: 'Auto-Renewal Contracts',
        description: `${autoRenewalContracts.length} contract${autoRenewalContracts.length > 1 ? 's' : ''} with auto-renewal clauses need attention`,
        impact: 'medium'
      });
    }
    
    if (marketingContracts.length > 0) {
      insights.push({
        type: 'opportunity',
        title: 'Marketing Contracts',
        description: `${marketingContracts.length} marketing contract${marketingContracts.length > 1 ? 's' : ''} show high savings potential`,
        impact: 'positive'
      });
    }
    
    return insights;
  };

  const generateRealRecommendations = (contracts) => {
    const recommendations = [];
    
    const highValueContracts = contracts.filter(c => {
      const value = c.value || c.contract_value || 0;
      return value > 1000;
    });
    const autoRenewalContracts = contracts.filter(c => c.auto_renewal === true || c.autoRenewal === true);
    const marketingContracts = contracts.filter(c => c.category === 'Marketing');
    
    if (highValueContracts.length > 0) {
      recommendations.push(`Prioritize renewal of ${highValueContracts.length} high-value contracts`);
    }
    
    if (autoRenewalContracts.length > 0) {
      recommendations.push(`Review auto-renewal terms for ${autoRenewalContracts.length} contracts`);
    }
    
    if (marketingContracts.length > 0) {
      recommendations.push(`Negotiate better terms for ${marketingContracts.length} marketing contracts`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Upload more contract data for detailed recommendations');
    }
    
    return recommendations;
  };

  const generateSavingsInsights = (contracts) => {
    const insights = [];
    
    // Find contracts with highest savings potential
    const sortedContracts = contracts
      .filter(c => {
        const value = c.value || c.contract_value || 0;
        return value > 0;
      })
      .sort((a, b) => {
        const savingsA = calculateContractSavings(a);
        const savingsB = calculateContractSavings(b);
        return savingsB - savingsA;
      });

    // Add top 3 contracts with highest savings potential
    sortedContracts.slice(0, 3).forEach((contract, index) => {
      const savings = calculateContractSavings(contract);
      if (savings > 0) {
        insights.push({
          type: 'opportunity',
          title: `${contract.contract_name || 'Contract'} (${contract.vendor})`,
          description: `${contract.category} contract with ${Math.round((savings / contract.value) * 100)}% savings potential`,
          impact: 'high',
          savings: `$${savings.toLocaleString()}`
        });
      }
    });

    if (insights.length === 0) {
      insights.push({
        type: 'info',
        title: 'No High-Value Opportunities',
        description: 'Upload contracts with higher values to see savings opportunities',
        impact: 'low'
      });
    }

    return insights;
  };

  const calculateContractSavings = (contract) => {
    const value = contract.value || contract.contract_value || 0;
    if (!value) return 0;
    
    let savingsRate = 0.10; // Default 10%
    switch (contract.category) {
      case 'Marketing': savingsRate = 0.25; break;
      case 'Services': savingsRate = 0.12; break;
      case 'Software': savingsRate = 0.18; break;
      case 'Hardware': savingsRate = 0.15; break;
    }
    
    // Higher value contracts have more negotiation potential
    if (value > 5000) savingsRate *= 1.2;
    if (value > 10000) savingsRate *= 1.3;
    
    return value * savingsRate;
  };

  const calculateCostOptimizationAnalysis = (contracts) => {
    if (!contracts || contracts.length === 0) {
      return {
        title: 'Cost Optimization Strategy',
        summary: 'No contract data available for analysis',
        insights: [
          {
            type: 'info',
            title: 'Upload Contract Data',
            description: 'Add contracts to see cost optimization opportunities',
            impact: 'low'
          }
        ],
        recommendations: ['Upload contract data to get started'],
        financialImpact: {
          potentialSavings: '$0',
          targetReduction: '0%',
          netImpact: '$0'
        }
      };
    }

    // Calculate real financial metrics
    const totalContractValue = contracts.reduce((sum, contract) => {
      const value = contract.value || contract.contract_value || 0;
      return sum + value;
    }, 0);

    const potentialSavings = calculatePotentialSavings(contracts);
    const targetReduction = totalContractValue > 0 ? Math.round((potentialSavings / totalContractValue) * 100) : 0;

    // Group contracts by vendor for consolidation analysis
    const vendorGroups = contracts.reduce((groups, contract) => {
      const vendor = contract.vendor || 'Unknown Vendor';
      if (!groups[vendor]) {
        groups[vendor] = [];
      }
      groups[vendor].push(contract);
      return groups;
    }, {});

    // Find consolidation opportunities
    const consolidationOpportunities = Object.entries(vendorGroups)
      .filter(([vendor, vendorContracts]) => vendorContracts.length > 1)
      .map(([vendor, vendorContracts]) => {
        const totalValue = vendorContracts.reduce((sum, contract) => {
          return sum + (contract.value || contract.contract_value || 0);
        }, 0);
        const consolidationSavings = totalValue * 0.15; // 15% volume discount
        
        return {
          vendor,
          contractCount: vendorContracts.length,
          totalValue,
          potentialSavings: consolidationSavings
        };
      })
      .sort((a, b) => b.potentialSavings - a.potentialSavings);

    // Find high-value contracts for competitive bidding
    const highValueContracts = contracts
      .filter(contract => {
        const value = contract.value || contract.contract_value || 0;
        return value > 1000;
      })
      .sort((a, b) => {
        const valueA = a.value || a.contract_value || 0;
        const valueB = b.value || b.contract_value || 0;
        return valueB - valueA;
      });

    // Generate insights based on real data
    const insights = [];

    // Add consolidation opportunities
    consolidationOpportunities.slice(0, 2).forEach(opportunity => {
      if (opportunity.potentialSavings > 0) {
        insights.push({
          type: 'opportunity',
          title: `Contract Consolidation - ${opportunity.vendor}`,
          description: `Merge ${opportunity.contractCount} similar contracts for 15% volume discount`,
          impact: 'high',
          savings: `$${Math.round(opportunity.potentialSavings).toLocaleString()}`
        });
      }
    });

    // Add competitive bidding opportunities
    const competitiveBiddingSavings = highValueContracts
      .slice(0, 3)
      .reduce((total, contract) => {
        const value = contract.value || contract.contract_value || 0;
        return total + (value * 0.12); // 12% savings from competitive bidding
      }, 0);

    if (competitiveBiddingSavings > 0) {
      insights.push({
        type: 'opportunity',
        title: 'Vendor Diversification',
        description: `Introduce competitive bidding for ${Math.min(3, highValueContracts.length)} high-value contracts`,
        impact: 'medium',
        savings: `$${Math.round(competitiveBiddingSavings).toLocaleString()}`
      });
    }

    // Add category-specific opportunities
    const categoryGroups = contracts.reduce((groups, contract) => {
      const category = contract.category || 'Other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(contract);
      return groups;
    }, {});

    Object.entries(categoryGroups).forEach(([category, categoryContracts]) => {
      if (categoryContracts.length > 1) {
        const categoryValue = categoryContracts.reduce((sum, contract) => {
          return sum + (contract.value || contract.contract_value || 0);
        }, 0);
        
        if (categoryValue > 5000) {
          const categorySavings = categoryValue * 0.08; // 8% category optimization
          insights.push({
            type: 'opportunity',
            title: `${category} Optimization`,
            description: `Optimize ${categoryContracts.length} ${category.toLowerCase()} contracts`,
            impact: 'medium',
            savings: `$${Math.round(categorySavings).toLocaleString()}`
          });
        }
      }
    });

    // If no insights, add a general one
    if (insights.length === 0) {
      insights.push({
        type: 'info',
        title: 'Limited Optimization Opportunities',
        description: 'Current contracts show limited consolidation potential',
        impact: 'low'
      });
    }

    // Generate recommendations
    const recommendations = [];
    
    if (consolidationOpportunities.length > 0) {
      recommendations.push(`Consolidate ${consolidationOpportunities.length} vendor groups within 60 days`);
    }
    
    if (highValueContracts.length > 0) {
      recommendations.push(`Launch RFP process for ${Math.min(3, highValueContracts.length)} high-value contracts`);
    }
    
    if (contracts.some(c => c.auto_renewal || c.autoRenewal)) {
      const autoRenewalCount = contracts.filter(c => c.auto_renewal || c.autoRenewal).length;
      recommendations.push(`Review auto-renewal terms for ${autoRenewalCount} contracts`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Monitor contract performance and market rates');
    }

    return {
      title: 'Cost Optimization Strategy',
      summary: `Comprehensive analysis of ${contracts.length} contracts with total value of $${totalContractValue.toLocaleString()}`,
      insights: insights.slice(0, 4), // Limit to 4 insights
      recommendations,
      financialImpact: {
        potentialSavings: `$${Math.round(potentialSavings).toLocaleString()}`,
        targetReduction: `${targetReduction}%`,
        netImpact: `$${Math.round(potentialSavings).toLocaleString()}`
      },
      detailedExplanations: {
        savings: getSavingsExplanation(contracts),
        risks: getRiskExplanation(contracts)
      }
    };
  };

  const simulateAIAnalysis = async (scenario) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Calculate real analytics based on actual contract data
    const realAnalytics = calculateRealAnalytics(contracts, scenario);
    
    switch (scenario.type) {
      case 'renewal-delay':
        return realAnalytics.renewalDelay;
      
      case 'savings-analysis':
        return realAnalytics.savingsAnalysis || {
          title: 'Top Savings Opportunities',
          summary: 'Identified contracts with highest savings potential',
          insights: [
            {
              type: 'opportunity',
              title: 'Software Licensing Contract',
              description: 'Potential 40% savings through volume discount negotiation',
              impact: 'high',
              savings: '$28,000'
            },
            {
              type: 'opportunity',
              title: 'Cloud Services Agreement',
              description: 'Optimize usage patterns to reduce costs by 25%',
              impact: 'medium',
              savings: '$15,000'
            },
            {
              type: 'opportunity',
              title: 'Maintenance Contract',
              description: 'Switch to pay-per-use model for 30% savings',
              impact: 'medium',
              savings: '$12,000'
            }
          ],
          recommendations: [
            'Initiate renegotiation for software licensing within 30 days',
            'Implement cloud cost monitoring and optimization',
            'Evaluate maintenance contract alternatives'
          ],
          financialImpact: {
            potentialSavings: '$55,000',
            implementationCost: '$5,000',
            netImpact: '$50,000'
          }
        };
      
      case 'cost-optimization':
        return calculateCostOptimizationAnalysis(contracts);
      
      default:
        return null;
    }
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'positive': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getImpactIcon = (impact) => {
    switch (impact) {
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <Clock className="h-4 w-4" />;
      case 'positive': return <CheckCircle className="h-4 w-4" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center rounded-full bg-white/80 backdrop-blur-xl px-6 py-3 mb-6 text-sm font-semibold text-slate-700 border border-white/30 shadow-lg">
          <Zap className="h-4 w-4 mr-2" />
          AI Decision Dashboard
        </div>
        <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 leading-tight mb-4">
          Smart Contract{" "}
          <span className="bg-gradient-to-r from-blue-600 via-slate-600 to-indigo-600 bg-clip-text text-transparent">
            Analytics
          </span>
        </h2>
        <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Get AI-powered insights and scenario modeling to make informed contract decisions
        </p>
      </div>

      {/* Scenario Cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        {scenarios.map((scenario) => {
          const IconComponent = scenario.icon;
          return (
            <div
              key={scenario.id}
              className="group relative rounded-2xl bg-white/90 backdrop-blur-xl p-6 border-2 border-white/40 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-white/60 cursor-pointer"
              onClick={() => runScenarioAnalysis(scenario)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-200/30">
                  <IconComponent className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-xs font-semibold text-slate-500 bg-slate-100/80 px-3 py-1 rounded-full">
                  AI Analysis
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                {scenario.title}
              </h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                {scenario.description}
              </p>
              
              <div className="flex items-center text-sm font-semibold text-blue-600 group-hover:text-blue-700 transition-colors">
                Run Analysis
                <TrendingUp className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Analysis Results */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100/80 backdrop-blur-xl mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Analyzing Scenarios</h3>
          <p className="text-slate-600">AI is processing your contract data...</p>
        </div>
      )}

      {analysisResults && !isLoading && (
        <div className="rounded-2xl bg-white/90 backdrop-blur-xl p-8 border-2 border-white/40 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-slate-900">{analysisResults.title}</h3>
            <div className="text-sm font-semibold text-blue-600 bg-blue-50/80 px-4 py-2 rounded-full border border-blue-200/30">
              AI Analysis Complete
            </div>
          </div>
          
          <p className="text-lg text-slate-600 mb-8 leading-relaxed">
            {analysisResults.summary}
          </p>

          {/* Financial Impact Summary */}
          {analysisResults.financialImpact && (
            <div className="grid gap-4 lg:grid-cols-3 mb-8">
              <div className="bg-gradient-to-br from-green-50/80 to-emerald-50/80 backdrop-blur-sm p-6 rounded-xl border border-green-200/30">
                <div className="flex items-center mb-2">
                  <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm font-semibold text-green-700">Potential Savings</span>
                </div>
                <div className="text-2xl font-bold text-green-800">
                  {analysisResults.financialImpact.potentialSavings}
                </div>
              </div>
              
              {analysisResults.financialImpact.riskExposure && (
                <div className="bg-gradient-to-br from-red-50/80 to-rose-50/80 backdrop-blur-sm p-6 rounded-xl border border-red-200/30">
                  <div className="flex items-center mb-2">
                    <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                    <span className="text-sm font-semibold text-red-700">Risk Exposure</span>
                  </div>
                  <div className="text-2xl font-bold text-red-800">
                    {analysisResults.financialImpact.riskExposure}
                  </div>
                </div>
              )}
              
              <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 backdrop-blur-sm p-6 rounded-xl border border-blue-200/30">
                <div className="flex items-center mb-2">
                  <Calculator className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-sm font-semibold text-blue-700">Net Impact</span>
                </div>
                <div className="text-2xl font-bold text-blue-800">
                  {analysisResults.financialImpact.netImpact}
                </div>
              </div>
            </div>
          )}

          {/* Detailed Explanations */}
          {analysisResults.detailedExplanations && (
            <div className="mb-8">
              <h4 className="text-xl font-bold text-slate-900 mb-6">How These Numbers Are Calculated</h4>
              
              {/* Savings Explanation */}
              <div className="bg-gradient-to-br from-green-50/80 to-emerald-50/80 backdrop-blur-sm p-6 rounded-xl border border-green-200/30 mb-6">
                <h5 className="text-lg font-bold text-green-800 mb-4 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Potential Savings Breakdown
                </h5>
                <div className="space-y-4">
                  {analysisResults.detailedExplanations.savings.map((explanation, index) => (
                    <div key={index} className="bg-white/60 backdrop-blur-sm p-4 rounded-lg border border-green-200/20">
                      <div className="flex justify-between items-start mb-2">
                        <h6 className="font-semibold text-green-800">{explanation.contractName}</h6>
                        <div className="text-right">
                          <div className="text-sm text-green-600">Contract Value: ${explanation.contractValue.toLocaleString()}</div>
                          <div className="text-sm text-green-600">Savings Rate: {(explanation.savingsRate * 100).toFixed(1)}%</div>
                          <div className="font-bold text-green-800">Potential Savings: ${explanation.potentialSavings.toFixed(0)}</div>
                        </div>
                      </div>
                      <p className="text-sm text-green-700 mb-2">{explanation.categoryExplanation}</p>
                      {explanation.valueExplanation && (
                        <p className="text-sm text-green-600 mb-3">{explanation.valueExplanation}</p>
                      )}
                      <div className="mt-3">
                        <h7 className="text-sm font-semibold text-green-800 mb-2 block">Actions to Achieve These Savings:</h7>
                        <ul className="text-sm text-green-700 space-y-1">
                          {explanation.actions.map((action, actionIndex) => (
                            <li key={actionIndex} className="flex items-start">
                              <span className="text-green-500 mr-2">•</span>
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Explanation */}
              <div className="bg-gradient-to-br from-red-50/80 to-rose-50/80 backdrop-blur-sm p-6 rounded-xl border border-red-200/30">
                <h5 className="text-lg font-bold text-red-800 mb-4 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Risk Exposure Breakdown
                </h5>
                <div className="space-y-4">
                  {analysisResults.detailedExplanations.risks.map((explanation, index) => (
                    <div key={index} className="bg-white/60 backdrop-blur-sm p-4 rounded-lg border border-red-200/20">
                      <div className="flex justify-between items-start mb-2">
                        <h6 className="font-semibold text-red-800">{explanation.contractName}</h6>
                        <div className="text-right">
                          <div className="text-sm text-red-600">Contract Value: ${explanation.contractValue.toLocaleString()}</div>
                          <div className="text-sm text-red-600">Risk Rate: {(explanation.riskRate * 100).toFixed(1)}%</div>
                          <div className="font-bold text-red-800">Risk Exposure: ${explanation.riskExposure.toFixed(0)}</div>
                        </div>
                      </div>
                      <p className="text-sm text-red-700 mb-2">{explanation.riskExplanation}</p>
                      <div className="mt-3">
                        <h7 className="text-sm font-semibold text-red-800 mb-2 block">Risk Factors:</h7>
                        <ul className="text-sm text-red-700 space-y-1 mb-3">
                          {explanation.riskFactors.map((factor, factorIndex) => (
                            <li key={factorIndex} className="flex items-start">
                              <span className="text-red-500 mr-2">•</span>
                              <span>{factor}</span>
                            </li>
                          ))}
                        </ul>
                        <h7 className="text-sm font-semibold text-red-800 mb-2 block">Mitigation Actions:</h7>
                        <ul className="text-sm text-red-700 space-y-1">
                          {explanation.mitigationActions.map((action, actionIndex) => (
                            <li key={actionIndex} className="flex items-start">
                              <span className="text-red-500 mr-2">•</span>
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Insights */}
          <div className="space-y-4 mb-8">
            <h4 className="text-xl font-bold text-slate-900 mb-4">Key Insights</h4>
            {analysisResults.insights.map((insight, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border backdrop-blur-sm ${getImpactColor(insight.impact)}`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3 mt-0.5">
                    {getImpactIcon(insight.impact)}
                  </div>
                  <div className="flex-1">
                    <h5 className="font-semibold mb-1">{insight.title}</h5>
                    <p className="text-sm leading-relaxed mb-2">{insight.description}</p>
                    {insight.savings && (
                      <div className="text-sm font-semibold text-green-700">
                        Potential Savings: {insight.savings}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recommendations */}
          <div className="bg-gradient-to-br from-slate-50/80 to-blue-50/80 backdrop-blur-sm p-6 rounded-xl border border-slate-200/30">
            <h4 className="text-xl font-bold text-slate-900 mb-4">AI Recommendations</h4>
            <ul className="space-y-3">
              {analysisResults.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">{index + 1}</span>
                  </div>
                  <span className="text-slate-700 leading-relaxed">{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mt-8">
            <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl">
              Export Analysis
            </button>
            <button className="px-6 py-3 bg-white/80 backdrop-blur-xl text-slate-700 font-semibold rounded-xl border border-slate-200/30 hover:bg-white/90 transition-all duration-300">
              Schedule Follow-up
            </button>
            <button 
              className="px-6 py-3 bg-white/80 backdrop-blur-xl text-slate-700 font-semibold rounded-xl border border-slate-200/30 hover:bg-white/90 transition-all duration-300"
              onClick={() => setAnalysisResults(null)}
            >
              Run New Analysis
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DecisionDashboard;
