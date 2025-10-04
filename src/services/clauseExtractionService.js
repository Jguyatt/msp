/**
 * Service for extracting contract clauses using GPT-4
 * Analyzes PDF text and identifies key contractual clauses
 */

import { extractTextFromPDFAPI } from './pdfTextExtractionAPI';
import { analyzeContractPricing } from './pricingMetricsService';

// OpenAI API configuration
const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY || 'your-openai-api-key-here';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Extract text from PDF file
 * @param {File} pdfFile - The PDF file to extract text from
 * @returns {Promise<string>} - Extracted text content
 */
async function extractTextFromPDF(pdfFile) {
  try {
    console.log('Extracting text from PDF:', pdfFile.name);
    
    // Convert File to ArrayBuffer
    const arrayBuffer = await pdfFile.arrayBuffer();
    
    // For client-side PDF parsing, we'll use a different approach
    // Since pdf-parse is a Node.js library, we'll implement a client-side solution
    
    // Option 1: Use PDF.js for client-side parsing (disabled due to CDN issues)
    if (typeof window !== 'undefined' && window.pdfjsLib) {
      console.log('PDF.js is available, but skipping due to worker issues');
    } else {
      console.log('PDF.js not available, using backend API');
    }
    
    // Option 2: Send to backend for server-side parsing (if available)
    try {
      const extractedText = await extractTextFromPDFAPI(pdfFile);
      console.log('Successfully extracted text from PDF via backend API');
      return extractedText;
    } catch (backendError) {
      console.warn('Backend PDF extraction failed:', backendError);
    }
    
    // Option 3: Fallback - return an error message instead of sample text
    console.warn('PDF text extraction not available - returning error message');
    throw new Error(`PDF text extraction failed for "${pdfFile.name}". Please check that the backend server is running and PDF.js is properly configured.`);
    
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

/**
 * Extract contract clauses using GPT-4
 * @param {string} contractText - The extracted text from the contract
 * @returns {Promise<Object>} - Structured clause data
 */
async function extractClausesWithGPT4(contractText) {
  try {
    // Check if OpenAI API key is configured
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-openai-api-key-here') {
      throw new Error('OpenAI API key is not configured. Please add REACT_APP_OPENAI_API_KEY to your .env file.');
    }

    const prompt = `You are a contract analysis expert. Extract and label all renewal-related clauses from the contract text below.

IMPORTANT: You MUST respond with ONLY valid JSON. Do not include any text before or after the JSON.

Contract text:
${contractText.substring(0, 2000)}

Analyze the text and return ONLY this JSON structure (no other text):
{
  "renewalClauses": [
    {
      "type": "auto-renewal",
      "description": "Description of the renewal clause",
      "noticePeriod": "X days/months",
      "penalties": "Any penalties mentioned",
      "confidence": 0.95
    }
  ],
  "terminationClauses": [
    {
      "type": "termination",
      "description": "Description of termination conditions",
      "noticePeriod": "X days/months",
      "penalties": "Any penalties mentioned",
      "confidence": 0.90
    }
  ],
  "pricingClauses": [
    {
      "type": "price-escalator",
      "description": "Description of pricing changes",
      "escalationRate": "X% or CPI",
      "penalties": "Any penalties mentioned",
      "confidence": 0.85
    }
  ],
  "penaltyClauses": [
    {
      "type": "late-payment",
      "description": "Description of penalty conditions",
      "penaltyRate": "X% per month",
      "conditions": "When penalties apply",
      "confidence": 0.88
    }
  ],
  "summary": {
    "totalClauses": 4,
    "highRiskClauses": ["auto-renewal", "penalty"],
    "recommendations": ["Review auto-renewal terms", "Negotiate penalty rates"]
  }
}

Focus on identifying:
1. Auto-renewal clauses and notice periods
2. Termination conditions and required notice
3. Price escalation clauses (CPI, fixed rates, etc.)
4. Penalty clauses (late payments, breach penalties)
5. Any other critical contractual terms

Return only valid JSON, no additional text.`;

    const response = await fetch(OPENAI_API_URL, {
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
            content: 'You are a contract analysis expert. Extract key contractual clauses and return structured JSON data.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Check if the response contains valid choices
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from OpenAI API - no choices available');
    }
    
    const content = data.choices[0].message.content;
    console.log('OpenAI API response content:', content);
    
    // Try to parse the content as JSON
    let extractedClauses;
    try {
      // Clean the content - remove any leading/trailing whitespace and try to find JSON
      let cleanedContent = content.trim();
      
      // If the response doesn't start with {, try to find the JSON part
      if (!cleanedContent.startsWith('{')) {
        const jsonStart = cleanedContent.indexOf('{');
        const jsonEnd = cleanedContent.lastIndexOf('}');
        
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          cleanedContent = cleanedContent.substring(jsonStart, jsonEnd + 1);
          console.log('Extracted JSON from response:', cleanedContent);
        }
      }
      
      extractedClauses = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      console.error('Raw content:', content);
      console.error('Content length:', content.length);
      console.error('First 200 chars:', content.substring(0, 200));
      
      // If it's not JSON, it might be an error message from OpenAI
      throw new Error(`OpenAI returned non-JSON response: ${content.substring(0, 100)}...`);
    }
    
    return extractedClauses;
  } catch (error) {
    console.error('Error extracting clauses with GPT-4:', error);
    
    // Return error information instead of mock data
    return {
      error: true,
      message: `Failed to analyze contract clauses: ${error.message}`,
      renewalClauses: [],
      terminationClauses: [],
      pricingClauses: [],
      penaltyClauses: [],
      summary: {
        totalClauses: 0,
        highRiskClauses: [],
        recommendations: ['Unable to analyze contract - check OpenAI API configuration'],
        error: true
      }
    };
  }
}

/**
 * Main function to extract clauses from a PDF file
 * @param {File} pdfFile - The PDF file to analyze
 * @returns {Promise<Object>} - Extracted clause data
 */
export async function extractContractClauses(pdfFile) {
  try {
    console.log('Starting clause extraction for:', pdfFile.name);
    
    // Step 1: Extract text from PDF
    const contractText = await extractTextFromPDF(pdfFile);
    
    // Step 2: Analyze with GPT-4
    const clauses = await extractClausesWithGPT4(contractText);
    
    // Step 3: Add metadata
    const result = {
      ...clauses,
      metadata: {
        fileName: pdfFile.name,
        extractedAt: new Date().toISOString(),
        fileSize: pdfFile.size,
        processingTime: Date.now()
      }
    };
    
    console.log('Clause extraction completed:', result);
    return result;
    
  } catch (error) {
    console.error('Error in clause extraction:', error);
    throw new Error(`Failed to extract contract clauses: ${error.message}`);
  }
}

/**
 * Test the clause extraction service with a sample contract
 * @returns {Promise<Object>} - Sample clause data
 */
export async function testClauseExtraction() {
  try {
    // This function now uses real GPT-4 analysis instead of mock data
    const sampleText = `
    SOFTWARE LICENSE AGREEMENT
    
    RENEWAL: This agreement shall automatically renew for successive one-year periods 
    unless either party provides written notice of termination at least 60 days prior 
    to the expiration date.
    
    TERMINATION: Either party may terminate this agreement with 45 days written notice 
    for any reason, or immediately for material breach.
    
    PRICING: License fees shall increase annually by the greater of 5% or the Consumer 
    Price Index for the previous year.
    
    PENALTIES: Late payments shall incur interest at the rate of 2% per month on 
    outstanding amounts.
    `;
    
    return await extractClausesWithGPT4(sampleText);
  } catch (error) {
    console.error('Error testing clause extraction:', error);
    throw error;
  }
}

/**
 * Enhanced function to extract clauses AND analyze pricing
 */
export async function extractContractClausesWithPricing(pdfFile, contractData) {
  try {
    console.log('Starting enhanced clause extraction with pricing analysis for:', pdfFile.name);
    
    // Extract text from PDF
    const contractText = await extractTextFromPDF(pdfFile);
    
    // Run both analyses in parallel for better performance
    const [extractedClauses, pricingAnalysis] = await Promise.all([
      extractClausesWithGPT4(contractText),
      analyzeContractPricing({
        ...contractData,
        contractText
      })
    ]);
    
    console.log('Enhanced extraction completed:', { extractedClauses, pricingAnalysis });
    
    return {
      clauses: extractedClauses,
      pricing: pricingAnalysis
    };
    
  } catch (error) {
    console.error('Error in enhanced contract analysis:', error);
    throw error;
  }
}

export default {
  extractContractClauses,
  extractContractClausesWithPricing,
  testClauseExtraction
};
