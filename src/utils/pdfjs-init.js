/**
 * PDF.js initialization DISABLED
 * Using backend API for PDF text extraction instead
 */

// PDF.js is completely disabled to avoid worker issues
// All PDF processing happens via backend API

// Make PDF.js unavailable globally to force backend fallback
if (typeof window !== 'undefined') {
  window.pdfjsLib = null;
}

// Export null to indicate PDF.js is not available
export default null;
