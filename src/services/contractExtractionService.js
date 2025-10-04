/**
 * AI-Powered Contract Extraction Service
 * Extracts contract details from PDF files using OpenAI API
 */

class ContractExtractionService {
  constructor() {
    this.apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';
  }

  /**
   * Extract contract details from PDF text
   */
  async extractContractDetails(pdfText, fileName) {
    try {
      const prompt = this.buildExtractionPrompt(pdfText, fileName);
      
      const response = await fetch(`${this.baseUrl}/extract-contract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: pdfText,
          fileName: fileName,
          prompt: prompt
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      return this.parseExtractedData(data.extractedData);
    } catch (error) {
      console.error('Error extracting contract details:', error);
      throw error;
    }
  }

  /**
   * Build the prompt for AI extraction
   */
  buildExtractionPrompt(text, fileName) {
    return `
Extract the following details from this contract text as a JSON object. Use the actual values found in the text, not placeholders or examples.

Contract Document: ${fileName}

Contract Text:
${text.substring(0, 8000)} ${text.length > 8000 ? '...[truncated]' : ''}

Extract and return the following information as a JSON object with these exact field names:

{
  "contract_name": "The official name or title of the contract",
  "vendor": "The vendor/supplier/company name",
  "start_date": "Contract start date in YYYY-MM-DD format",
  "end_date": "Contract end date in YYYY-MM-DD format", 
  "value": "Total contract value as a number (no currency symbols)",
  "contact_email": "Primary contact email address",
  "category": "Contract category (Software, Services, Hardware, Marketing, etc.)",
  "status": "Contract status (Active, Pending, Expired, etc.)",
  "auto_renewal": "Whether contract auto-renews (true/false)",
  "notice_period_days": "Notice period for cancellation in days",
  "description": "Brief description of the contract"
}

Important guidelines:
- Extract ACTUAL values from the contract text, not placeholder text
- If a field cannot be found, use null for that field
- For dates, only use YYYY-MM-DD format
- For value, extract only the number (remove currency symbols and commas)
- For auto_renewal, return true if the contract mentions automatic renewal
- Return ONLY the JSON object, no explanatory text
- For notice_period_days, extract the number of days mentioned for cancellation notice
- Be conservative - if you're not sure about a value, use null
`;
  }

  /**
   * Parse and validate the extracted data
   */
  parseExtractedData(data) {
    try {
      // If data is a string, parse it as JSON
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }

      // Validate and clean the data
      const cleaned = {
        contract_name: this.cleanString(data.contract_name),
        vendor: this.cleanString(data.vendor),
        start_date: this.cleanDate(data.start_date),
        end_date: this.cleanDate(data.end_date),
        value: this.cleanNumber(data.value),
        contact_email: this.cleanEmail(data.contact_email),
        category: this.cleanString(data.category) || 'Other',
        status: this.cleanString(data.status) || 'Active',
        auto_renewal: Boolean(data.auto_renewal),
        notice_period_days: this.cleanNumber(data.notice_period_days),
        description: this.cleanString(data.description)
      };

      return cleaned;
    } catch (error) {
      console.error('Error parsing extracted data:', error);
      throw new Error('Failed to parse extracted contract data');
    }
  }

  /**
   * Clean string values
   */
  cleanString(value) {
    if (!value || typeof value !== 'string') return null;
    return value.trim() || null;
  }

  /**
   * Clean and validate email addresses
   */
  cleanEmail(email) {
    if (!email || typeof email !== 'string') return null;
    const cleaned = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(cleaned) ? cleaned : null;
  }

  /**
   * Clean and validate dates
   */
  cleanDate(date) {
    if (!date) return null;
    
    try {
      // Handle various date formats
      const dateStr = String(date).trim();
      
      // If it's already in YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
      }
      
      // Try to parse and reformat
      const parsedDate = new Date(dateStr);
      if (isNaN(parsedDate.getTime())) {
        return null;
      }
      
      return parsedDate.toISOString().split('T')[0];
    } catch (error) {
      return null;
    }
  }

  /**
   * Clean and validate numbers
   */
  cleanNumber(value) {
    if (!value && value !== 0) return null;
    
    try {
      // Remove currency symbols, commas, and spaces
      const cleaned = String(value).replace(/[$,\s]/g, '');
      const parsed = parseFloat(cleaned);
      
      return isNaN(parsed) ? null : parsed;
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract text from PDF file using backend API
   */
  async extractTextFromPDF(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${this.baseUrl}/extract-pdf-text`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      return data.text || '';
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw error;
    }
  }

  /**
   * Main method to extract contract details from PDF file
   */
  async extractFromPDF(file) {
    try {
      // Extract text from PDF
      const pdfText = await this.extractTextFromPDF(file);
      
      if (!pdfText || pdfText.trim().length === 0) {
        throw new Error('No text could be extracted from the PDF file');
      }
      
      // Extract contract details using AI
      const extractedData = await this.extractContractDetails(pdfText, file.name);
      
      return {
        success: true,
        data: extractedData,
        extractedText: pdfText
      };
    } catch (error) {
      console.error('Error extracting from PDF:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Validate extracted contract data
   */
  validateExtractedData(data) {
    const errors = [];
    
    if (!data.contract_name) {
      errors.push('Contract name is required');
    }
    
    if (!data.vendor) {
      errors.push('Vendor name is required');
    }
    
    if (!data.start_date) {
      errors.push('Start date is required');
    }
    
    if (!data.end_date) {
      errors.push('End date is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
}

const contractExtractionService = new ContractExtractionService();
export default contractExtractionService;
