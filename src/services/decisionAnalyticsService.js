// Decision Analytics Service for AI-powered contract analysis
import { supabase } from '../lib/supabase';

class DecisionAnalyticsService {
  constructor() {
    this.apiEndpoint = process.env.REACT_APP_DECISION_ANALYTICS_API || '/api/decision-analytics';
  }

  // Analyze renewal delay impact
  async analyzeRenewalDelay(contracts, delayDays = 30) {
    try {
      // Filter contracts that are coming up for renewal using real data
      const upcomingRenewals = contracts.filter(contract => {
        // Use daysUntil if available (from your existing contract data)
        if (contract.daysUntil !== undefined) {
          return contract.daysUntil <= delayDays + 30 && contract.daysUntil > 0;
        }
        
        // Fallback to calculating from renewalDate
        if (contract.renewalDate) {
          const renewalDate = new Date(contract.renewalDate);
          const now = new Date();
          const daysUntilRenewal = Math.ceil((renewalDate - now) / (1000 * 60 * 60 * 24));
          return daysUntilRenewal <= delayDays + 30 && daysUntilRenewal > 0;
        }
        
        return false;
      });

      // Run analysis with real contract data
      const analysis = await this.simulateRenewalDelayAnalysis(upcomingRenewals, delayDays);
      
      return {
        success: true,
        data: analysis,
        contractsAnalyzed: upcomingRenewals.length
      };
    } catch (error) {
      console.error('Error analyzing renewal delay:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  // Find contracts with highest savings potential
  async findSavingsOpportunities(contracts, timeframe = 'quarter', topCount = 3) {
    try {
      // Filter contracts based on real data characteristics
      const savingsCandidates = contracts.filter(contract => {
        // Use real contract data to identify savings potential
        const hasValue = contract.value && contract.value > 5000; // Adjust threshold based on your data
        const isActive = contract.status === 'active';
        const hasCategory = contract.category && ['software', 'cloud', 'services', 'general'].includes(contract.category);
        
        return hasValue && isActive && hasCategory;
      });

      // Sort by potential savings amount using real contract value
      const sortedBySavings = savingsCandidates.sort((a, b) => {
        const savingsA = this.calculatePotentialSavings(a);
        const savingsB = this.calculatePotentialSavings(b);
        return savingsB - savingsA;
      });

      // Take top N contracts
      const topOpportunities = sortedBySavings.slice(0, topCount);

      // Run analysis with real contract data
      const analysis = await this.simulateSavingsAnalysis(topOpportunities, timeframe);
      
      return {
        success: true,
        data: analysis,
        contractsAnalyzed: savingsCandidates.length
      };
    } catch (error) {
      console.error('Error finding savings opportunities:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  // Cost optimization analysis
  async analyzeCostOptimization(contracts, reductionTarget = 15) {
    try {
      const totalContractValue = contracts.reduce((sum, contract) => sum + (contract.value || 0), 0);
      const targetSavings = (totalContractValue * reductionTarget) / 100;

      // Simulate AI analysis
      const analysis = await this.simulateCostOptimizationAnalysis(contracts, reductionTarget, targetSavings);
      
      return {
        success: true,
        data: analysis,
        contractsAnalyzed: contracts.length
      };
    } catch (error) {
      console.error('Error analyzing cost optimization:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  // Helper method to determine if contract has savings potential
  hasSavingsPotential(contract) {
    // Use real contract data to determine savings potential
    const indicators = [
      contract.category === 'software' || contract.category === 'cloud' || contract.category === 'services',
      contract.value > 25000, // Adjust threshold based on your data
      !contract.negotiationHistory || contract.negotiationHistory.length === 0,
      contract.vendorCompetition === 'high' || contract.vendorCompetition === 'medium'
    ];
    
    return indicators.filter(Boolean).length >= 2;
  }

  // Calculate potential savings for a contract using real data
  calculatePotentialSavings(contract) {
    // Calculate savings based on real contract characteristics
    const baseValue = contract.value || 0;
    const baseSavings = baseValue * 0.15; // 15% base savings
    
    // Add multipliers based on real contract characteristics
    let multiplier = 1;
    if (contract.category === 'software') multiplier *= 1.4;
    if (contract.category === 'cloud') multiplier *= 1.3;
    if (contract.category === 'services') multiplier *= 1.2;
    if (contract.vendorCompetition === 'high') multiplier *= 1.3;
    if (contract.vendorCompetition === 'medium') multiplier *= 1.1;
    if (!contract.negotiationHistory || contract.negotiationHistory.length === 0) multiplier *= 1.2;
    if (contract.marketTrend === 'favorable') multiplier *= 1.2;
    
    return Math.round(baseSavings * multiplier);
  }

  // Simulate renewal delay analysis using real contract data
  async simulateRenewalDelayAnalysis(contracts, delayDays) {
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
    
    // Analyze real contracts for risk and opportunities
    const highRiskContracts = contracts.filter(contract => {
      const penaltyRisk = contract.hasPenaltyClause || contract.autoRenewal;
      const hasValue = contract.value && contract.value > 10000;
      return penaltyRisk && hasValue;
    });

    const negotiationOpportunities = contracts.filter(contract => {
      const marketConditions = contract.vendorCompetition === 'high' || contract.marketTrend === 'favorable';
      const noPenalty = !contract.hasPenaltyClause;
      const hasValue = contract.value && contract.value > 5000;
      return marketConditions && noPenalty && hasValue;
    });

    // Calculate realistic financial impact based on actual contract values
    const potentialSavings = negotiationOpportunities.reduce((sum, contract) => {
      return sum + this.calculatePotentialSavings(contract);
    }, 0);

    const riskExposure = highRiskContracts.reduce((sum, contract) => {
      const riskAmount = (contract.value || 0) * 0.2; // 20% risk on delayed contracts
      return sum + riskAmount;
    }, 0);

    return {
      title: 'Renewal Delay Impact Analysis',
      summary: `Delaying renewals by ${delayDays} days could result in significant cost variations`,
      insights: [
        {
          type: 'warning',
          title: 'High Risk Contracts',
          description: `${highRiskContracts.length} contracts show potential cost increases of 15-25%`,
          impact: 'high',
          contracts: highRiskContracts.map(c => c.id)
        },
        {
          type: 'opportunity',
          title: 'Negotiation Window',
          description: `${negotiationOpportunities.length} contracts have favorable market conditions for renegotiation`,
          impact: 'positive',
          contracts: negotiationOpportunities.map(c => c.id)
        }
      ],
      recommendations: [
        'Prioritize renewal of high-risk contracts within 15 days',
        'Use delay period to negotiate better terms for favorable contracts',
        'Consider early renewal for contracts with penalty clauses'
      ],
      financialImpact: {
        potentialSavings: `$${this.formatNumber(potentialSavings)}`,
        riskExposure: `$${this.formatNumber(riskExposure)}`,
        netImpact: `$${this.formatNumber(potentialSavings - riskExposure)}`
      }
    };
  }

  // Simulate savings analysis using real contract data
  async simulateSavingsAnalysis(contracts, timeframe) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Calculate total savings based on real contract values
    const totalSavings = contracts.reduce((sum, contract) => {
      return sum + this.calculatePotentialSavings(contract);
    }, 0);

    // Generate insights based on real contract data
    const insights = contracts.map((contract, index) => {
      const savings = this.calculatePotentialSavings(contract);
      const savingsPercentage = Math.round((savings / (contract.value || 1)) * 100);
      
      return {
        type: 'opportunity',
        title: contract.name || `Contract ${index + 1}`,
        description: `Potential ${savingsPercentage}% savings through optimization (${contract.vendor || 'Unknown vendor'})`,
        impact: contract.value > 50000 ? 'high' : 'medium',
        savings: `$${this.formatNumber(savings)}`,
        contractId: contract.id
      };
    });

    return {
      title: 'Top Savings Opportunities',
      summary: `Identified ${contracts.length} contracts with highest savings potential this ${timeframe}`,
      insights: insights,
      recommendations: [
        'Initiate renegotiation for high-value contracts within 30 days',
        'Implement usage monitoring and optimization',
        'Evaluate alternative vendors and pricing models'
      ],
      financialImpact: {
        potentialSavings: `$${this.formatNumber(totalSavings)}`,
        implementationCost: `$${this.formatNumber(totalSavings * 0.1)}`,
        netImpact: `$${this.formatNumber(totalSavings * 0.9)}`
      }
    };
  }

  // Simulate cost optimization analysis
  async simulateCostOptimizationAnalysis(contracts, reductionTarget, targetSavings) {
    await new Promise(resolve => setTimeout(resolve, 1800));
    
    const totalValue = contracts.reduce((sum, contract) => sum + (contract.value || 0), 0);
    const achievableSavings = Math.min(targetSavings, totalValue * 0.25); // Max 25% reduction

    return {
      title: 'Cost Optimization Strategy',
      summary: `Comprehensive analysis to achieve ${reductionTarget}% cost reduction target`,
      insights: [
        {
          type: 'opportunity',
          title: 'Contract Consolidation',
          description: 'Merge similar contracts for volume discounts',
          impact: 'high',
          savings: `$${this.formatNumber(achievableSavings * 0.6)}`
        },
        {
          type: 'opportunity',
          title: 'Vendor Diversification',
          description: 'Introduce competitive bidding for key contracts',
          impact: 'medium',
          savings: `$${this.formatNumber(achievableSavings * 0.4)}`
        }
      ],
      recommendations: [
        'Consolidate similar service contracts within 60 days',
        'Launch RFP process for key vendor contracts',
        'Implement automated contract monitoring and optimization'
      ],
      financialImpact: {
        potentialSavings: `$${this.formatNumber(achievableSavings)}`,
        targetReduction: `${reductionTarget}%`,
        netImpact: `$${this.formatNumber(achievableSavings)}`
      }
    };
  }

  // Format numbers with commas
  formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // Get contract analytics summary
  async getAnalyticsSummary(contracts) {
    try {
      const summary = {
        totalContracts: contracts.length,
        totalValue: contracts.reduce((sum, contract) => sum + (contract.value || 0), 0),
        upcomingRenewals: contracts.filter(contract => {
          const renewalDate = new Date(contract.renewalDate);
          const now = new Date();
          const daysUntilRenewal = Math.ceil((renewalDate - now) / (1000 * 60 * 60 * 24));
          return daysUntilRenewal <= 90;
        }).length,
        highValueContracts: contracts.filter(contract => contract.value > 100000).length,
        savingsOpportunities: contracts.filter(contract => this.hasSavingsPotential(contract)).length
      };

      return {
        success: true,
        data: summary
      };
    } catch (error) {
      console.error('Error getting analytics summary:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
}

export default new DecisionAnalyticsService();
