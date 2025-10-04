/**
 * API service for PDF text extraction
 * This provides a fallback option for server-side PDF parsing
 */

const API_BASE_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:3002';

/**
 * Extract text from PDF using server-side API
 * @param {File} pdfFile - The PDF file to extract text from
 * @returns {Promise<string>} - Extracted text content
 */
export async function extractTextFromPDFAPI(pdfFile) {
  try {
    console.log('Attempting server-side PDF text extraction for:', pdfFile.name);
    
    const formData = new FormData();
    formData.append('pdf', pdfFile);
    
    const response = await fetch(`${API_BASE_URL}/api/extract-pdf-text`, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type, let browser set it with boundary for FormData
      }
    });
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.success && result.text) {
      console.log('Successfully extracted text from PDF via API');
      return result.text;
    } else {
      throw new Error(result.error || 'Failed to extract text from PDF');
    }
    
  } catch (error) {
    console.error('API PDF text extraction failed:', error);
    throw error;
  }
}

/**
 * Check if the PDF text extraction API is available
 * @returns {Promise<boolean>} - Whether the API is available
 */
export async function checkPDFExtractionAPIAvailability() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/extract-pdf-text/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return response.ok;
  } catch (error) {
    console.log('PDF extraction API not available:', error.message);
    return false;
  }
}

export default {
  extractTextFromPDFAPI,
  checkPDFExtractionAPIAvailability
};
