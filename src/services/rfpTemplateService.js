/**
 * RFP Template Generation Service
 * Uses GPT-4 to generate custom RFP templates with contract metadata and benchmark KPIs
 * Includes caching to avoid regenerating the same template multiple times
 */

import { analyzeContractPricing } from './pricingMetricsService';
import { supabase } from '../lib/supabase';

/**
 * Checks if an RFP template already exists for a contract
 * @param {string} contractId - The contract ID to check
 * @returns {Object|null} Existing template data or null if not found
 */
export async function getCachedRFPTemplate(contractId) {
  try {
    console.log('Checking for cached RFP template for contract:', contractId);
    
    const { data, error } = await supabase
      .from('rfp_templates')
      .select('*')
      .eq('contract_id', contractId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found - this is expected for new contracts
        console.log('No cached RFP template found for contract:', contractId);
        return null;
      }
      throw error;
    }

    console.log('Found cached RFP template for contract:', contractId);
    return data;
  } catch (error) {
    console.error('Error fetching cached RFP template:', error);
    return null;
  }
}

/**
 * Saves an RFP template to the cache
 * @param {string} contractId - The contract ID
 * @param {Object} templateData - The generated template data
 * @param {Object} contractContext - Contract metadata used for generation
 * @param {Object} benchmarkContext - Benchmark data used for generation
 * @param {Object} clauseContext - Clause data used for generation
 * @returns {Object} Saved template data
 */
export async function saveRFPTemplate(contractId, templateData, contractContext, benchmarkContext, clauseContext) {
  try {
    console.log('Saving RFP template to cache for contract:', contractId);
    
    const { data, error } = await supabase
      .from('rfp_templates')
      .insert({
        contract_id: contractId,
        template_data: templateData,
        contract_context: contractContext,
        benchmark_context: benchmarkContext,
        clause_context: clauseContext
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log('RFP template saved successfully:', data.id);
    return data;
  } catch (error) {
    console.error('Error saving RFP template:', error);
    throw error;
  }
}

/**
 * Generates an RFP template using GPT-4 with contract metadata and benchmark data
 * Checks cache first to avoid regenerating existing templates
 * @param {string} contractId - The contract ID
 * @param {Object} contractData - Contract information including vendor, service type, etc.
 * @param {Object} benchmarkData - Pricing benchmark data for the service
 * @param {Object} clauseData - Extracted contract clauses for reference
 * @param {boolean} forceRegenerate - Force regeneration even if cached version exists
 * @returns {Object} Generated RFP template with sections and placeholders
 */
export async function generateRFPTemplate(contractId, contractData, benchmarkData = null, clauseData = null, forceRegenerate = false) {
  try {
    console.log('Starting RFP template generation for contract:', contractId);

    // Check cache first (unless force regeneration is requested)
    if (!forceRegenerate) {
      const cachedTemplate = await getCachedRFPTemplate(contractId);
      if (cachedTemplate) {
        console.log('Using cached RFP template for contract:', contractId);
        return {
          success: true,
          template: cachedTemplate.template_data,
          generatedAt: cachedTemplate.generated_at,
          contractContext: cachedTemplate.contract_context,
          benchmarkContext: cachedTemplate.benchmark_context,
          clauseContext: cachedTemplate.clause_context,
          fromCache: true
        };
      }
    }

    console.log('Generating new RFP template for:', contractData.contractName);

    // Prepare the contract context for GPT-4
    const contractContext = {
      vendor: contractData.vendorName || 'Vendor',
      service: contractData.contractName || 'Service',
      currentValue: contractData.currentValue || 'Not specified',
      duration: contractData.contractDuration || '12 months',
      renewalDate: contractData.renewalDate || new Date().toISOString(),
      requirements: contractData.requirements || []
    };

    // Prepare benchmark context
    const benchmarkContext = benchmarkData ? {
      industryAverage: benchmarkData.benchmarkRate,
      priceRange: benchmarkData.range,
      variance: benchmarkData.variancePercentage,
      recommendations: benchmarkData.recommendations
    } : null;

    // Prepare clause context
    const clauseContext = clauseData ? {
      renewalTerms: clauseData.renewalClauses || [],
      terminationTerms: clauseData.terminationClauses || [],
      pricingTerms: clauseData.pricingClauses || [],
      penaltyTerms: clauseData.penaltyClauses || []
    } : null;

    // Construct the GPT-4 prompt
    const prompt = buildRFPPrompt(contractContext, benchmarkContext, clauseContext);

    // Call GPT-4 API
    const rfpTemplate = await callGPT4ForRFP(prompt);

    // Save to cache
    try {
      await saveRFPTemplate(contractId, rfpTemplate, contractContext, benchmarkContext, clauseContext);
      console.log('RFP template saved to cache successfully');
    } catch (saveError) {
      console.warn('Failed to save RFP template to cache:', saveError);
      // Continue even if saving fails - template is still generated
    }

    return {
      success: true,
      template: rfpTemplate,
      generatedAt: new Date().toISOString(),
      contractContext,
      benchmarkContext,
      clauseContext,
      fromCache: false
    };

  } catch (error) {
    console.error('Error generating RFP template:', error);
    return {
      success: false,
      error: error.message,
      template: getFallbackTemplate(contractData),
      generatedAt: new Date().toISOString()
    };
  }
}

/**
 * Builds the GPT-4 prompt for RFP generation
 */
function buildRFPPrompt(contractContext, benchmarkContext, clauseContext) {
  let prompt = `You are a procurement specialist creating a Request for Proposal (RFP) template. Generate a comprehensive RFP outline with REAL, SPECIFIC content based on the following contract information:

CONTRACT DETAILS:
- Vendor: ${contractContext.vendor}
- Service: ${contractContext.service}
- Current Value: ${contractContext.currentValue}
- Contract Duration: ${contractContext.duration}
- Renewal Date: ${contractContext.renewalDate}
- Start Date: ${contractContext.startDate}
- End Date: ${contractContext.endDate}
- Payment Terms: ${contractContext.paymentTerms}
- Service Level: ${contractContext.serviceLevel}
- Support Hours: ${contractContext.supportHours}
- Key Contacts: ${contractContext.keyContacts}

`;

  if (benchmarkContext) {
    prompt += `PRICING BENCHMARKS:
- Industry Average: $${benchmarkContext.industryAverage}/unit
- Price Range: $${benchmarkContext.priceRange?.min} - $${benchmarkContext.priceRange?.max}
- Current Variance: ${benchmarkContext.variance}%
- Recommendations: ${benchmarkContext.recommendations?.join(', ') || 'Standard pricing'}

`;
  }

  if (clauseContext) {
    prompt += `CONTRACT TERMS (for reference):
- Renewal Terms: ${clauseContext.renewalTerms?.length || 0} clauses found
- Termination Terms: ${clauseContext.terminationTerms?.length || 0} clauses found
- Pricing Terms: ${clauseContext.pricingTerms?.length || 0} clauses found
- Penalty Terms: ${clauseContext.penaltyTerms?.length || 0} clauses found

`;
  }

  prompt += `INSTRUCTIONS:
Build an RFP template for ${contractContext.service} from ${contractContext.vendor}, using REAL data instead of generic placeholders. Make it specific and actionable.

Include the following sections with DETAILED, SPECIFIC content:

1. EXECUTIVE SUMMARY - Brief overview of the RFP for ${contractContext.service}
2. PROJECT SCOPE - Detailed scope of work for ${contractContext.service} with specific deliverables
3. TECHNICAL REQUIREMENTS - Technical specifications and standards for ${contractContext.service}
4. PRICING STRUCTURE - Pricing model with specific targets based on current value of ${contractContext.currentValue}
5. TIMELINE & MILESTONES - Project timeline with key milestones over ${contractContext.duration}
6. EVALUATION CRITERIA - Scoring methodology and evaluation factors
7. CONTRACT TERMS - Standard terms and conditions
8. SUBMISSION REQUIREMENTS - Response format and requirements

IMPORTANT: Use the ACTUAL service name "${contractContext.service}" and vendor "${contractContext.vendor}" throughout. Do NOT use generic placeholders like [Service] or [PLACEHOLDER]. Make it specific and professional.

Return ONLY valid JSON in this exact format:
{
  "title": "RFP Title",
  "summary": "Brief description",
  "sections": [
    {
      "id": "executive_summary",
      "title": "Executive Summary",
      "content": "Section content with [PLACEHOLDER] tags",
      "placeholders": ["placeholder1", "placeholder2"]
    }
  ],
  "benchmarkTargets": {
    "pricing": "Target pricing based on benchmarks",
    "timeline": "Expected timeline",
    "quality": "Quality standards"
  },
  "evaluationCriteria": [
    {
      "category": "Technical",
      "weight": 40,
      "criteria": ["Criteria 1", "Criteria 2"]
    }
  ]
}`;

  return prompt;
}

/**
 * Calls GPT-4 API for RFP generation
 */
async function callGPT4ForRFP(prompt) {
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

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
          content: 'You are a procurement specialist with expertise in creating comprehensive RFP templates. Always return valid JSON format as requested.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000
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
    console.error('Failed to parse GPT-4 RFP response:', parseError);
    throw new Error(`Failed to parse RFP template: ${parseError.message}`);
  }
}

/**
 * Fallback template when GPT-4 generation fails
 */
function getFallbackTemplate(contractData) {
  const serviceName = contractData.contractName || 'Service';
  const vendorName = contractData.vendorName || 'Vendor';
  const currentValue = contractData.currentValue || 'Not specified';
  const duration = contractData.contractDuration || '12 months';
  
  return {
    title: `RFP for ${serviceName} - ${vendorName}`,
    summary: `Request for Proposal template for ${serviceName} renewal with ${vendorName}`,
    sections: [
      {
        id: 'executive_summary',
        title: 'Executive Summary',
        content: `This RFP seeks proposals for ${serviceName} services from qualified vendors. The selected vendor will provide comprehensive ${serviceName} solutions for a contract period of ${duration}. Current contract value is ${currentValue}.`,
        placeholders: []
      },
      {
        id: 'project_scope',
        title: 'Project Scope',
        content: `The vendor shall provide the following ${serviceName} services: comprehensive implementation, ongoing support, and maintenance. Deliverables include system setup, user training, documentation, and 24/7 support coverage.`,
        placeholders: []
      },
      {
        id: 'pricing_structure',
        title: 'Pricing Structure',
        content: `Pricing should be based on current market rates for ${serviceName}. Target pricing should be competitive with current contract value of ${currentValue}. Proposals should include both one-time setup costs and recurring monthly/annual fees.`,
        placeholders: []
      }
    ],
    benchmarkTargets: {
      pricing: 'Competitive market rates',
      timeline: 'Standard project timeline',
      quality: 'Industry standards'
    },
    evaluationCriteria: [
      {
        category: 'Technical',
        weight: 40,
        criteria: ['Technical approach', 'Experience', 'Quality']
      },
      {
        category: 'Pricing',
        weight: 30,
        criteria: ['Cost competitiveness', 'Value proposition']
      },
      {
        category: 'Management',
        weight: 30,
        criteria: ['Project management', 'Timeline', 'Support']
      }
    ]
  };
}

/**
 * Analyzes contract data to extract key metrics for RFP generation
 */
export function analyzeContractForRFP(contract) {
  console.log('Analyzing contract for RFP:', contract);
  
  // Calculate contract duration in months
  let duration = '12 months'; // default
  if (contract.start_date && contract.end_date) {
    const startDate = new Date(contract.start_date);
    const endDate = new Date(contract.end_date);
    const diffInMonths = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24 * 30));
    duration = `${diffInMonths} months`;
  }

  const analysis = {
    contractName: contract.contract_name || 'Unknown Service',
    vendorName: contract.vendor || 'Unknown Vendor',
    currentValue: contract.value ? `$${contract.value.toLocaleString()}` : 'Not specified',
    contractDuration: duration,
    startDate: contract.start_date || 'Not specified',
    endDate: contract.end_date || 'Not specified',
    renewalDate: contract.end_date || new Date().toISOString(),
    noticePeriod: '30 days', // Default notice period
    autoRenewal: false, // Default to manual renewal
    paymentTerms: 'Net 30', // Default payment terms
    serviceLevel: 'Standard', // Default service level
    supportHours: '9 AM - 5 PM EST', // Default support hours
    keyContacts: contract.contact_email || 'Not specified',
    contractId: contract.id || 'Not specified',
    companyName: 'Your Company', // This could be pulled from company data
    complexity: 'Standard',
    riskLevel: 'Medium'
  };

  // Analyze contract complexity based on available data
  if (contract.contract_pdf_url) {
    analysis.complexity = 'Detailed';
  }

  if (contract.daysUntil && contract.daysUntil < 30) {
    analysis.riskLevel = 'High';
    analysis.urgency = 'Immediate';
  }

  console.log('Contract analysis result:', analysis);
  return analysis;
}

export default {
  generateRFPTemplate,
  getCachedRFPTemplate,
  saveRFPTemplate,
  analyzeContractForRFP,
  buildRFPPrompt,
  getFallbackTemplate
};
