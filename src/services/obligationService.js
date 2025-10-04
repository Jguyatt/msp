// Note: This service is designed to work with the existing supabaseService
// Import supabase from the lib directory if needed
// import { supabase } from '../lib/supabase';

class ObligationService {
  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';
  }

  /**
   * Generate AI-driven optimal renewal dates for contracts
   */
  async generateOptimalRenewalDates(contracts) {
    const optimalDates = [];
    
    for (const contract of contracts) {
      const optimalDate = this.calculateOptimalRenewalDate(contract);
      optimalDates.push({
        contractId: contract.id,
        contractName: contract.contract_name,
        vendor: contract.vendor,
        currentEndDate: contract.end_date,
        optimalRenewalDate: optimalDate.date,
        daysBeforeExpiry: optimalDate.daysBefore,
        reasoning: optimalDate.reasoning,
        profitMaximization: optimalDate.profitMaximization,
        riskAssessment: optimalDate.riskAssessment
      });
    }
    
    return optimalDates;
  }

  /**
   * Calculate optimal renewal date using AI logic
   */
  calculateOptimalRenewalDate(contract) {
    const endDate = new Date(contract.end_date);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    
    // AI-driven logic for optimal renewal timing
    let optimalDaysBefore = 60; // Default baseline
    let riskLevel = 'Medium';
    let complexityFactor = 1.0;
    
    // Contract value analysis
    if (contract.value > 100000) {
      optimalDaysBefore = 120; // High-value contracts need extensive planning
      complexityFactor = 1.5;
    } else if (contract.value > 50000) {
      optimalDaysBefore = 90;
      complexityFactor = 1.2;
    } else if (contract.value < 5000) {
      optimalDaysBefore = 30; // Low-value contracts can be renewed closer to expiry
      complexityFactor = 0.8;
    }
    
    // Auto-renewal analysis
    if (contract.auto_renewal) {
      optimalDaysBefore = Math.min(optimalDaysBefore, 45); // Auto-renewal requires earlier action
      riskLevel = 'High'; // Auto-renewal increases risk
    }
    
    // Contract type analysis
    if (contract.category === 'Software' || contract.category === 'Services') {
      optimalDaysBefore += 15; // Software/services often need more evaluation time
    }
    
    // Market volatility factor (simulated)
    const marketVolatility = this.assessMarketVolatility(contract.category);
    if (marketVolatility === 'High') {
      optimalDaysBefore += 30;
      riskLevel = 'High';
    }
    
    const optimalDate = new Date(endDate.getTime() - (optimalDaysBefore * 24 * 60 * 60 * 1000));
    
    return {
      date: optimalDate,
      daysBefore: optimalDaysBefore,
      reasoning: this.generateRenewalReasoning(contract, optimalDaysBefore, riskLevel),
      profitMaximization: this.calculateProfitMaximization(contract, optimalDate, complexityFactor),
      riskAssessment: {
        level: riskLevel,
        factors: this.assessRiskFactors(contract),
        mitigation: this.generateRiskMitigation(contract)
      }
    };
  }

  /**
   * Assess market volatility for contract category
   */
  assessMarketVolatility(category) {
    const volatilityMap = {
      'Software': 'High',
      'Services': 'Medium',
      'Hardware': 'Medium',
      'Marketing': 'High',
      'Consulting': 'Medium',
      'Maintenance': 'Low'
    };
    
    return volatilityMap[category] || 'Medium';
  }

  /**
   * Generate reasoning for optimal renewal timing
   */
  generateRenewalReasoning(contract, daysBefore, riskLevel) {
    const reasons = [];
    
    if (contract.value > 100000) {
      reasons.push('High-value contract requires extensive market research and competitive bidding');
    } else if (contract.value > 50000) {
      reasons.push('Significant investment warrants thorough vendor evaluation');
    }
    
    if (contract.auto_renewal) {
      reasons.push('Auto-renewal clause requires early termination notice to avoid unwanted extensions');
    }
    
    if (daysBefore >= 90) {
      reasons.push('Extended timeline enables comprehensive RFP process and vendor negotiations');
    } else if (daysBefore >= 60) {
      reasons.push('Adequate time for market analysis and competitive proposals');
    }
    
    if (riskLevel === 'High') {
      reasons.push('High-risk factors require additional buffer time for contingency planning');
    }
    
    return reasons.join('; ');
  }

  /**
   * Calculate profit maximization potential
   */
  calculateProfitMaximization(contract, optimalDate, complexityFactor) {
    const endDate = new Date(contract.end_date);
    const daysEarly = Math.ceil((endDate - optimalDate) / (1000 * 60 * 60 * 24));
    
    // Base savings calculation
    let baseSavingsPercentage = 0.05; // 5% baseline
    
    // Time-based savings
    if (daysEarly >= 120) {
      baseSavingsPercentage = 0.25; // Up to 25% with very early planning
    } else if (daysEarly >= 90) {
      baseSavingsPercentage = 0.20; // Up to 20% with early planning
    } else if (daysEarly >= 60) {
      baseSavingsPercentage = 0.15; // Up to 15% with good planning
    } else if (daysEarly >= 30) {
      baseSavingsPercentage = 0.10; // Up to 10% with adequate planning
    }
    
    // Apply complexity factor
    baseSavingsPercentage *= complexityFactor;
    
    // Market competition factor
    const competitionFactor = this.assessMarketCompetition(contract.category);
    baseSavingsPercentage *= competitionFactor;
    
    const estimatedSavings = contract.value * baseSavingsPercentage;
    
    return {
      estimatedSavings,
      percentage: baseSavingsPercentage * 100,
      riskReduction: this.calculateRiskReduction(daysEarly),
      marketLeverage: this.calculateMarketLeverage(daysEarly),
      negotiationPower: this.calculateNegotiationPower(daysEarly, contract.value)
    };
  }

  /**
   * Assess market competition for category
   */
  assessMarketCompetition(category) {
    const competitionMap = {
      'Software': 1.3, // High competition = more leverage
      'Services': 1.2,
      'Hardware': 1.1,
      'Marketing': 1.4,
      'Consulting': 1.1,
      'Maintenance': 0.9
    };
    
    return competitionMap[category] || 1.0;
  }

  /**
   * Calculate risk reduction based on timing
   */
  calculateRiskReduction(daysEarly) {
    if (daysEarly >= 90) return 'High';
    if (daysEarly >= 60) return 'Medium-High';
    if (daysEarly >= 30) return 'Medium';
    return 'Low';
  }

  /**
   * Calculate market leverage based on timing
   */
  calculateMarketLeverage(daysEarly) {
    if (daysEarly >= 90) return 'Maximum';
    if (daysEarly >= 60) return 'High';
    if (daysEarly >= 30) return 'Moderate';
    return 'Limited';
  }

  /**
   * Calculate negotiation power
   */
  calculateNegotiationPower(daysEarly, contractValue) {
    let base = 0.7; // Base negotiation power
    
    // Time factor
    if (daysEarly >= 90) base += 0.2;
    else if (daysEarly >= 60) base += 0.1;
    
    // Value factor
    if (contractValue > 100000) base += 0.1;
    else if (contractValue > 50000) base += 0.05;
    
    return Math.min(base, 1.0); // Cap at 100%
  }

  /**
   * Assess risk factors for contract
   */
  assessRiskFactors(contract) {
    const factors = [];
    
    if (contract.auto_renewal) {
      factors.push('Auto-renewal clause creates binding commitment risk');
    }
    
    if (contract.value > 100000) {
      factors.push('High financial exposure requires careful planning');
    }
    
    if (contract.notice_period_days && contract.notice_period_days < 30) {
      factors.push('Short notice period limits flexibility');
    }
    
    const marketVolatility = this.assessMarketVolatility(contract.category);
    if (marketVolatility === 'High') {
      factors.push('Volatile market conditions increase uncertainty');
    }
    
    return factors;
  }

  /**
   * Generate risk mitigation strategies
   */
  generateRiskMitigation(contract) {
    const strategies = [];
    
    if (contract.auto_renewal) {
      strategies.push('Establish calendar reminders for termination deadlines');
      strategies.push('Document decision-making process for renewal evaluation');
    }
    
    strategies.push('Conduct regular market research and vendor evaluation');
    strategies.push('Maintain backup vendor relationships');
    strategies.push('Create detailed renewal timeline with milestone tracking');
    
    if (contract.value > 50000) {
      strategies.push('Engage procurement team early in process');
      strategies.push('Consider multi-vendor competitive bidding');
    }
    
    return strategies;
  }

  /**
   * Generate automated tasks for contract milestones
   */
  async generateAutomatedTasks(contract) {
    const tasks = [];
    const now = new Date();
    const endDate = new Date(contract.end_date);
    const daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    const optimalRenewal = this.calculateOptimalRenewalDate(contract);
    
    // Renewal proposal tasks
    if (daysUntilExpiry <= 90) {
      tasks.push({
        id: `renewal-proposal-${contract.id}`,
        contractId: contract.id,
        title: 'Draft Comprehensive Renewal Proposal',
        description: `Create detailed renewal proposal for ${contract.vendor} including market analysis, cost comparison, and negotiation strategy`,
        type: 'renewal',
        priority: 'high',
        dueDate: new Date(now.getTime() + (60 * 24 * 60 * 60 * 1000)),
        status: 'pending',
        aiGenerated: true,
        estimatedHours: 8,
        dependencies: ['market-research', 'cost-analysis'],
        tags: ['renewal', 'proposal', 'negotiation']
      });
    }
    
    // Market research tasks
    tasks.push({
      id: `market-research-${contract.id}`,
      contractId: contract.id,
      title: 'Conduct Market Research',
      description: `Research current market rates and alternative vendors for ${contract.category} services`,
      type: 'research',
      priority: 'high',
      dueDate: new Date(optimalRenewal.date.getTime() - (30 * 24 * 60 * 60 * 1000)),
      status: 'pending',
      aiGenerated: true,
      estimatedHours: 4,
      tags: ['research', 'market-analysis', 'benchmarking']
    });
    
    // Compliance tasks
    if (contract.auto_renewal) {
      tasks.push({
        id: `compliance-notice-${contract.id}`,
        contractId: contract.id,
        title: 'Send Termination Notice',
        description: `Send formal termination notice to ${contract.vendor} within required timeframe`,
        type: 'compliance',
        priority: 'critical',
        dueDate: new Date(endDate.getTime() - ((contract.notice_period_days || 30) * 24 * 60 * 60 * 1000)),
        status: 'pending',
        aiGenerated: true,
        estimatedHours: 2,
        tags: ['compliance', 'legal', 'notice']
      });
    }
    
    // Audit preparation tasks
    tasks.push({
      id: `audit-prep-${contract.id}`,
      contractId: contract.id,
      title: 'Prepare Audit Documentation',
      description: `Collect and organize all documentation for ${contract.vendor} contract audit`,
      type: 'audit',
      priority: 'medium',
      dueDate: new Date(endDate.getTime() - (30 * 24 * 60 * 60 * 1000)),
      status: 'pending',
      aiGenerated: true,
      estimatedHours: 3,
      tags: ['audit', 'documentation', 'compliance']
    });
    
    return tasks;
  }

  /**
   * Get task analytics and insights
   */
  async getTaskAnalytics(tasks) {
    const analytics = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      pendingTasks: tasks.filter(t => t.status === 'pending').length,
      overdueTasks: tasks.filter(t => t.status === 'pending' && new Date(t.dueDate) < new Date()).length,
      
      byPriority: {
        high: tasks.filter(t => t.priority === 'high').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        low: tasks.filter(t => t.priority === 'low').length
      },
      
      byType: tasks.reduce((acc, task) => {
        acc[task.type] = (acc[task.type] || 0) + 1;
        return acc;
      }, {}),
      
      estimatedTotalHours: tasks.reduce((total, task) => total + (task.estimatedHours || 0), 0),
      
      completionRate: tasks.length > 0 ? 
        (tasks.filter(t => t.status === 'completed').length / tasks.length) * 100 : 0
    };
    
    return analytics;
  }

  /**
   * Sync tasks with calendar systems (placeholder for future integration)
   */
  async syncWithCalendar(tasks) {
    // This would integrate with Google Calendar, Outlook, etc.
    console.log('Syncing tasks with calendar:', tasks.length, 'tasks');
    
    // Placeholder implementation
    const calendarEvents = tasks.map(task => ({
      title: task.title,
      start: task.dueDate,
      end: new Date(new Date(task.dueDate).getTime() + (task.estimatedHours || 2) * 60 * 60 * 1000),
      description: task.description,
      allDay: false,
      reminders: ['1 hour', '1 day'],
      metadata: {
        taskId: task.id,
        contractId: task.contractId,
        priority: task.priority,
        type: task.type
      }
    }));
    
    return calendarEvents;
  }
}

const obligationService = new ObligationService();
export { obligationService };
