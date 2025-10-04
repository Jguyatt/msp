/**
 * Pricing Metrics Service
 * Fetches live pricing data and compares vendor rates to industry benchmarks
 */

// Industry benchmark data (in a real app, this would come from APIs like:
// - Gartner pricing data
// - IDC market research
// - Vendor pricing APIs
// - Industry databases)

const INDUSTRY_BENCHMARKS = {
  'software': {
    'office-365': { 
      average: 12.00, 
      range: { min: 8.00, max: 18.00 },
      unit: 'per user/month',
      lastUpdated: '2024-09-01'
    },
    'microsoft-azure': { 
      average: 150.00, 
      range: { min: 100.00, max: 300.00 },
      unit: 'per month',
      lastUpdated: '2024-09-01'
    },
    'aws': { 
      average: 200.00, 
      range: { min: 120.00, max: 400.00 },
      unit: 'per month',
      lastUpdated: '2024-09-01'
    },
    'salesforce': { 
      average: 150.00, 
      range: { min: 100.00, max: 300.00 },
      unit: 'per user/month',
      lastUpdated: '2024-09-01'
    },
    'slack': { 
      average: 8.75, 
      range: { min: 6.00, max: 15.00 },
      unit: 'per user/month',
      lastUpdated: '2024-09-01'
    }
  },
  'cloud-storage': {
    'google-drive': { 
      average: 6.00, 
      range: { min: 4.00, max: 12.00 },
      unit: 'per user/month',
      lastUpdated: '2024-09-01'
    },
    'dropbox': { 
      average: 12.00, 
      range: { min: 8.00, max: 20.00 },
      unit: 'per user/month',
      lastUpdated: '2024-09-01'
    }
  },
  'security': {
    'okta': { 
      average: 3.00, 
      range: { min: 2.00, max: 5.00 },
      unit: 'per user/month',
      lastUpdated: '2024-09-01'
    },
    'crowdstrike': { 
      average: 8.50, 
      range: { min: 6.00, max: 12.00 },
      unit: 'per endpoint/month',
      lastUpdated: '2024-09-01'
    }
  }
};

/**
 * Identifies the product category and vendor from contract details
 */
function identifyProduct(contractName, vendorName) {
  const contractLower = contractName.toLowerCase();
  const vendorLower = vendorName.toLowerCase();
  
  // Office 365 / Microsoft products
  if (contractLower.includes('office') || contractLower.includes('365') || vendorLower.includes('microsoft')) {
    return { category: 'software', product: 'office-365', vendor: 'Microsoft' };
  }
  
  // Microsoft (any Microsoft product)
  if (vendorLower.includes('microsoft') || contractLower.includes('microsoft')) {
    return { category: 'software', product: 'office-365', vendor: 'Microsoft' };
  }
  
  // Azure
  if (contractLower.includes('azure') || contractLower.includes('cloud')) {
    return { category: 'software', product: 'microsoft-azure', vendor: 'Microsoft' };
  }
  
  // AWS
  if (contractLower.includes('aws') || contractLower.includes('amazon web services')) {
    return { category: 'software', product: 'aws', vendor: 'Amazon' };
  }
  
  // Salesforce
  if (contractLower.includes('salesforce') || contractLower.includes('crm')) {
    return { category: 'software', product: 'salesforce', vendor: 'Salesforce' };
  }
  
  // Slack
  if (contractLower.includes('slack')) {
    return { category: 'software', product: 'slack', vendor: 'Slack' };
  }
  
  // Google Drive
  if (contractLower.includes('google') || contractLower.includes('drive')) {
    return { category: 'cloud-storage', product: 'google-drive', vendor: 'Google' };
  }
  
  // Dropbox
  if (contractLower.includes('dropbox')) {
    return { category: 'cloud-storage', product: 'dropbox', vendor: 'Dropbox' };
  }
  
  // Okta
  if (contractLower.includes('okta') || contractLower.includes('identity')) {
    return { category: 'security', product: 'okta', vendor: 'Okta' };
  }
  
  // CrowdStrike
  if (contractLower.includes('crowdstrike') || contractLower.includes('security')) {
    return { category: 'security', product: 'crowdstrike', vendor: 'CrowdStrike' };
  }
  
  // Default fallback
  return { category: 'software', product: 'generic', vendor: vendorName };
}

/**
 * Extracts pricing information from contract text using AI
 */
async function extractPricingFromContract(contractText, contractName, vendorName) {
  try {
    const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `Extract pricing information from this contract text.

IMPORTANT: You MUST respond with ONLY valid JSON. Do not include any text before or after the JSON.

Contract: ${contractName}
Vendor: ${vendorName}
Contract text: ${contractText.substring(0, 1500)}

Extract and return ONLY this JSON structure (no other text):
{
  "pricingDetails": [
    {
      "type": "renewal_rate" | "initial_rate" | "escalation" | "penalty",
      "amount": 0,
      "currency": "USD",
      "unit": "per user/month" | "per month" | "per year" | "one-time",
      "description": "description of the pricing",
      "effectiveDate": "YYYY-MM-DD",
      "confidence": 0.9
    }
  ],
  "totalAnnualCost": 0,
  "currency": "USD",
  "pricingModel": "per-user" | "flat-rate" | "usage-based" | "tiered",
  "summary": "Brief summary of pricing structure"
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a contract pricing analysis expert. Extract pricing details and return structured JSON data.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
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
    
    const content = data.choices[0].message.content.trim();
    
    // Clean the content to extract JSON
    let cleanedContent = content;
    if (!cleanedContent.startsWith('{')) {
      const jsonStart = cleanedContent.indexOf('{');
      const jsonEnd = cleanedContent.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanedContent = cleanedContent.substring(jsonStart, jsonEnd + 1);
      }
    }
    
    return JSON.parse(cleanedContent);
    
  } catch (error) {
    console.error('Error extracting pricing from contract:', error);
    return {
      pricingDetails: [],
      totalAnnualCost: 0,
      currency: 'USD',
      pricingModel: 'unknown',
      summary: 'Unable to extract pricing information',
      error: error.message
    };
  }
}

/**
 * Compares vendor pricing to industry benchmarks
 */
async function compareToBenchmarks(contractData) {
  try {
    const { contractName, vendorName, contractText } = contractData;
    
    // Extract pricing from contract
    const pricingData = await extractPricingFromContract(contractText, contractName, vendorName);
    
    // Identify the product
    const productInfo = identifyProduct(contractName, vendorName);
    
    // Get industry benchmark
    const benchmark = INDUSTRY_BENCHMARKS[productInfo.category]?.[productInfo.product];
    
    if (!benchmark) {
      return {
        ...pricingData,
        benchmarkComparison: {
          available: false,
          message: `No benchmark data available for ${productInfo.vendor} ${productInfo.product}`,
          productInfo
        }
      };
    }
    
    // Find renewal rate in pricing details
    const renewalRate = pricingData.pricingDetails.find(p => p.type === 'renewal_rate' || p.type === 'initial_rate');
    
    if (!renewalRate) {
      return {
        ...pricingData,
        benchmarkComparison: {
          available: false,
          message: 'No renewal rate found in contract pricing',
          productInfo,
          benchmark
        }
      };
    }
    
    // Calculate variance
    const vendorRate = renewalRate.amount;
    const benchmarkRate = benchmark.average;
    const variance = ((vendorRate - benchmarkRate) / benchmarkRate) * 100;
    const varianceAbs = Math.abs(variance);
    
    // Determine if variance is significant (>10%)
    const significantVariance = varianceAbs > 10;
    
    // Calculate savings/cost impact
    const annualImpact = (vendorRate - benchmarkRate) * 12; // Assuming monthly pricing
    const impactType = vendorRate > benchmarkRate ? 'overpaying' : 'saving';
    
    return {
      ...pricingData,
      benchmarkComparison: {
        available: true,
        productInfo,
        benchmark,
        vendorRate,
        benchmarkRate,
        variance: Math.round(variance * 100) / 100, // Round to 2 decimal places
        varianceAbs: Math.round(varianceAbs * 100) / 100,
        significantVariance,
        impactType,
        annualImpact: Math.round(Math.abs(annualImpact) * 100) / 100,
        recommendation: significantVariance 
          ? `Consider negotiating - ${impactType} ${Math.abs(variance).toFixed(1)}% vs industry average`
          : 'Pricing is within industry standards',
        lastUpdated: benchmark.lastUpdated
      }
    };
    
  } catch (error) {
    console.error('Error comparing to benchmarks:', error);
    return {
      error: error.message,
      benchmarkComparison: {
        available: false,
        message: 'Error analyzing pricing benchmarks'
      }
    };
  }
}

/**
 * Main function to analyze contract pricing against benchmarks
 */
export async function analyzeContractPricing(contractData) {
  try {
    console.log('Starting pricing analysis for contract:', contractData.contractName);
    
    const analysis = await compareToBenchmarks(contractData);
    
    console.log('Pricing analysis completed:', analysis);
    
    return analysis;
    
  } catch (error) {
    console.error('Error in contract pricing analysis:', error);
    return {
      error: error.message,
      benchmarkComparison: {
        available: false,
        message: 'Failed to analyze contract pricing'
      }
    };
  }
}

/**
 * Get benchmark data for a specific product
 */
export function getBenchmarkData(productCategory, productName) {
  return INDUSTRY_BENCHMARKS[productCategory]?.[productName] || null;
}

/**
 * Get all available benchmarks
 */
export function getAllBenchmarks() {
  return INDUSTRY_BENCHMARKS;
}

export default {
  analyzeContractPricing,
  getBenchmarkData,
  getAllBenchmarks,
  identifyProduct
};
