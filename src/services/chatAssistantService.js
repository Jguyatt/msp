/**
 * Conversational Assistant Service
 * Provides natural language contract insights and recommendations
 * Uses GPT-4 to analyze contract data and answer user questions
 */

import { supabase } from '../lib/supabase';

/**
 * Analyzes contract data to provide insights for chat responses
 * @param {Object} contract - The contract data
 * @param {Array} allContracts - All user contracts for context
 * @returns {Object} Analysis results
 */
export function analyzeContractForChat(contract, allContracts = []) {
  const analysis = {
    contractId: contract.id,
    vendor: contract.vendor,
    serviceName: contract.contract_name,
    currentValue: contract.value,
    startDate: contract.start_date,
    endDate: contract.end_date,
    daysUntilExpiry: contract.daysUntil,
    renewalRisk: 'Low',
    usagePattern: 'Standard',
    costTrend: 'Stable',
    recommendations: []
  };

  // Calculate renewal risk
  if (contract.daysUntil <= 30) {
    analysis.renewalRisk = 'High';
    analysis.recommendations.push('Immediate action required - contract expires within 30 days');
  } else if (contract.daysUntil <= 90) {
    analysis.renewalRisk = 'Medium';
    analysis.recommendations.push('Start renewal negotiations soon');
  }

  // Analyze usage patterns based on contract type
  if (contract.vendor?.toLowerCase().includes('microsoft') || contract.contract_name?.toLowerCase().includes('office')) {
    analysis.usagePattern = 'High Growth';
    analysis.costTrend = 'Increasing';
    analysis.recommendations.push('Consider volume licensing for cost optimization');
  } else if (contract.vendor?.toLowerCase().includes('aws') || contract.contract_name?.toLowerCase().includes('cloud')) {
    analysis.usagePattern = 'Variable';
    analysis.costTrend = 'Fluctuating';
    analysis.recommendations.push('Monitor usage patterns and implement cost controls');
  }

  // Compare with other contracts
  const similarContracts = allContracts.filter(c => 
    c.vendor === contract.vendor && c.id !== contract.id
  );
  
  if (similarContracts.length > 0) {
    const avgValue = similarContracts.reduce((sum, c) => sum + (c.value || 0), 0) / similarContracts.length;
    if (contract.value > avgValue * 1.2) {
      analysis.recommendations.push('Contract value is 20% above similar contracts - consider renegotiation');
    }
  }

  return analysis;
}

/**
 * Generates optimal renewal window based on usage patterns
 * @param {Object} contract - The contract data
 * @param {Object} analysis - Contract analysis
 * @returns {Object} Renewal window recommendation
 */
export function calculateOptimalRenewalWindow(contract, analysis) {
  const daysUntilExpiry = contract.daysUntil;
  const renewalRisk = analysis.renewalRisk;
  
  let optimalWindow = {
    startDays: 90,
    endDays: 30,
    urgency: 'Normal',
    reasoning: 'Standard renewal timeline'
  };

  // Adjust based on risk level
  if (renewalRisk === 'High') {
    optimalWindow = {
      startDays: 0,
      endDays: 0,
      urgency: 'Critical',
      reasoning: 'Contract expires very soon - immediate action required'
    };
  } else if (renewalRisk === 'Medium') {
    optimalWindow = {
      startDays: 30,
      endDays: 15,
      urgency: 'High',
      reasoning: 'Start negotiations within 30 days to avoid service interruption'
    };
  }

  // Adjust based on usage patterns
  if (analysis.usagePattern === 'High Growth') {
    optimalWindow.startDays = Math.max(optimalWindow.startDays, 120);
    optimalWindow.reasoning += ' - Early renewal recommended due to high growth usage';
  } else if (analysis.usagePattern === 'Variable') {
    optimalWindow.startDays = Math.max(optimalWindow.startDays, 60);
    optimalWindow.reasoning += ' - Monitor usage patterns before renewal';
  }

  return optimalWindow;
}

/**
 * Processes a natural language question about contracts
 * @param {string} question - User's question
 * @param {Array} contracts - User's contracts
 * @param {Object} specificContract - Specific contract if question is about one
 * @returns {Object} Response with answer and insights
 */
export async function processContractQuestion(question, contracts, specificContract = null) {
  try {
    console.log('Processing contract question:', question);
    
    // Analyze contracts for context
    const contractAnalyses = contracts.map(contract => 
      analyzeContractForChat(contract, contracts)
    );
    
    // If asking about a specific contract, focus on that
    let focusContract = specificContract;
    if (!focusContract && question.toLowerCase().includes('azure')) {
      focusContract = contracts.find(c => 
        c.vendor?.toLowerCase().includes('microsoft') || 
        c.contract_name?.toLowerCase().includes('azure')
      );
    }
    
    // Build context for GPT-4
    const context = buildChatContext(contractAnalyses, focusContract, question);
    
    // Call GPT-4 for intelligent response
    const response = await callGPT4ForChat(question, context, focusContract);
    
    return {
      success: true,
      answer: response.answer,
      insights: response.insights,
      recommendations: response.recommendations,
      contractId: focusContract?.id,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error processing contract question:', error);
    return {
      success: false,
      answer: "I'm sorry, I encountered an error while processing your question. Please try again.",
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Builds context for GPT-4 chat responses
 */
function buildChatContext(contractAnalyses, focusContract, question) {
  let context = `You are a contract management assistant. Here's the user's contract portfolio:\n\n`;
  
  // Add contract summaries
  contractAnalyses.forEach((analysis, index) => {
    context += `Contract ${index + 1}:
- Vendor: ${analysis.vendor}
- Service: ${analysis.serviceName}
- Value: $${analysis.currentValue?.toLocaleString() || 'Not specified'}
- Expires: ${analysis.endDate} (${analysis.daysUntilExpiry} days)
- Risk Level: ${analysis.renewalRisk}
- Usage Pattern: ${analysis.usagePattern}
- Cost Trend: ${analysis.costTrend}
- Recommendations: ${analysis.recommendations.join(', ') || 'None'}

`;
  });
  
  // Add specific contract details if focused
  if (focusContract) {
    const analysis = analyzeContractForChat(focusContract, contractAnalyses.map(a => ({ id: a.contractId })));
    const renewalWindow = calculateOptimalRenewalWindow(focusContract, analysis);
    
    context += `FOCUS CONTRACT (${focusContract.contract_name}):
- Detailed Analysis: ${JSON.stringify(analysis, null, 2)}
- Optimal Renewal Window: ${JSON.stringify(renewalWindow, null, 2)}

`;
  }
  
  context += `User Question: "${question}"\n\n`;
  
  return context;
}

/**
 * Calls GPT-4 API for intelligent chat responses
 */
async function callGPT4ForChat(question, context, focusContract) {
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `You are an expert contract management assistant. Based on the contract data provided, answer the user's question with specific, actionable insights.

${context}

Instructions:
1. Provide a direct, helpful answer to the user's question
2. Include specific contract details and dates when relevant
3. Offer actionable recommendations
4. If asking about renewal timing, provide optimal windows based on usage patterns
5. Be conversational but professional
6. Focus on the most relevant contract if multiple contracts are mentioned

Return your response in this JSON format:
{
  "answer": "Your direct answer to the user's question",
  "insights": ["Key insight 1", "Key insight 2"],
  "recommendations": ["Actionable recommendation 1", "Actionable recommendation 2"]
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a contract management expert. Always return valid JSON format as requested.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Invalid response from OpenAI API');
  }

  const content = data.choices[0].message.content;
  
  // Parse the JSON response
  try {
    let cleanedContent = content.trim();
    
    // Find JSON within the response if needed
    if (!cleanedContent.startsWith('{')) {
      const jsonStart = cleanedContent.indexOf('{');
      const jsonEnd = cleanedContent.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanedContent = cleanedContent.substring(jsonStart, jsonEnd + 1);
      }
    }
    
    return JSON.parse(cleanedContent);
  } catch (parseError) {
    console.error('Failed to parse GPT-4 chat response:', parseError);
    // Fallback response
    return {
      answer: "I can help you with contract management questions. Could you please rephrase your question?",
      insights: ["Contract analysis available"],
      recommendations: ["Review contract details for specific recommendations"]
    };
  }
}

/**
 * Gets contract suggestions based on user input
 * @param {string} input - User's partial input
 * @param {Array} contracts - Available contracts
 * @returns {Array} Suggested completions
 */
export function getContractSuggestions(input, contracts) {
  if (!input || input.length < 2) return [];
  
  const inputLower = input.toLowerCase();
  const suggestions = [];
  
  // Search by vendor
  contracts.forEach(contract => {
    if (contract.vendor?.toLowerCase().includes(inputLower)) {
      suggestions.push({
        type: 'vendor',
        text: `Ask about ${contract.vendor} contracts`,
        contractId: contract.id
      });
    }
  });
  
  // Search by service name
  contracts.forEach(contract => {
    if (contract.contract_name?.toLowerCase().includes(inputLower)) {
      suggestions.push({
        type: 'service',
        text: `Ask about ${contract.contract_name}`,
        contractId: contract.id
      });
    }
  });
  
  // Common questions
  const commonQuestions = [
    'When should we renew our contracts?',
    'Which contracts are expiring soon?',
    'What are our highest value contracts?',
    'How can we optimize contract costs?',
    'Which vendors do we work with most?'
  ];
  
  commonQuestions.forEach(question => {
    if (question.toLowerCase().includes(inputLower)) {
      suggestions.push({
        type: 'question',
        text: question,
        contractId: null
      });
    }
  });
  
  return suggestions.slice(0, 5); // Limit to 5 suggestions
}

export default {
  processContractQuestion,
  analyzeContractForChat,
  calculateOptimalRenewalWindow,
  getContractSuggestions
};
