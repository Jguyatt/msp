import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useUserSync } from '../../hooks/useUserSync';
import { X, Calendar, DollarSign, Mail, User, Building, Upload, FileText, Trash2, Zap, Brain, Loader2 } from 'lucide-react';
import { contractService } from '../../services/supabaseService';
import contractExtractionService from '../../services/contractExtractionService';
import { contractLimitService } from '../../services/contractLimitService';
import UpgradePrompt from './UpgradePrompt';

function AddContractModal({ isOpen, onClose, onSave }) {
  const { clerkUser, supabaseUser } = useUserSync();
  const [formData, setFormData] = useState({
    vendor: '',
    contract_name: '',
    start_date: '',
    end_date: '',
    value: '',
    contact_email: '',
    category: '',
    auto_renewal: false,
    notice_period_days: null,
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  // AI Extraction states
  const [extractionMode, setExtractionMode] = useState('ai'); // 'ai' or 'manual' - Updated
  const [extracting, setExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState(null);
  const [showManualFallback, setShowManualFallback] = useState(false);
  
  // Drag and drop states
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Upgrade prompt states
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradePromptData, setUpgradePromptData] = useState({});
  
  // Contract limit states
  const [contractLimitInfo, setContractLimitInfo] = useState(null);
  const [showLimitWarning, setShowLimitWarning] = useState(false);

  // Reset states when modal opens and check contract limits
  useEffect(() => {
    if (isOpen) {
      setShowManualFallback(false);
      setExtractionError(null);
      setExtracting(false);
      setUploadedFile(null);
      checkContractLimits();
    }
  }, [isOpen]);

  // Check contract limits when modal opens
  const checkContractLimits = async () => {
    if (!clerkUser || !supabaseUser) return;
    
    try {
      // Get current contract count
      const contracts = await contractService.getContractsForUser(clerkUser.emailAddresses[0].emailAddress);
      const currentCount = contracts.length;
      
      // Get user's actual plan from subscription service
      const limits = contractLimitService.getContractLimits();
      const planName = await contractLimitService.getUserPlan(supabaseUser.id);
      const limit = limits[planName] || limits['Free'];
      
      // Check if approaching limit
      if (contractLimitService.isApproachingLimit(planName, currentCount, limit)) {
        const warning = contractLimitService.getProactiveWarning(planName, currentCount, limit);
        if (warning) {
          setContractLimitInfo(warning);
          setShowLimitWarning(true);
        }
      }
      
      // Check if at limit
      if (limit !== -1 && currentCount >= limit) {
        const upgradeMessage = contractLimitService.getUpgradeMessage(planName, limit, currentCount);
        setUpgradePromptData(upgradeMessage);
        setShowUpgradePrompt(true);
        return false; // Cannot create more contracts
      }
      
      return true; // Can create contracts
    } catch (error) {
      console.error('Error checking contract limits:', error);
      return true; // Allow creation if check fails
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.vendor.trim()) {
      newErrors.vendor = 'Vendor is required';
    }

    if (!formData.contract_name.trim()) {
      newErrors.contract_name = 'Contract name is required';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
    }

    if (!formData.contact_email.trim()) {
      newErrors.contact_email = 'Contact email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.contact_email)) {
      newErrors.contact_email = 'Please enter a valid email address';
    }

    // Validate date logic
    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      
      if (endDate <= startDate) {
        newErrors.end_date = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await processFile(file);
  };

  const processFile = async (file) => {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('File size must be less than 10MB');
      return;
    }

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    setUploadingFile(true);
    setExtractionError(null);
    
    try {
      // Store file info
      setUploadedFile({
        name: file.name,
        size: file.size,
        type: file.type,
        file: file // Store the actual file object
      });

      // If in AI mode, automatically extract contract details
      if (extractionMode === 'ai') {
        await handleAIExtraction(file);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please try again.');
    } finally {
      setUploadingFile(false);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleAIExtraction = async (file) => {
    setExtracting(true);
    setExtractionError(null);
    setShowManualFallback(false);
    
    try {
      const result = await contractExtractionService.extractFromPDF(file);
      
      if (result.success && result.data) {
        // Validate extracted data
        const validation = contractExtractionService.validateExtractedData(result.data);
        
        if (validation.isValid) {
          // Populate form with extracted data INCLUDING DESCRIPTION
          setFormData(prev => ({
            ...prev,
            vendor: result.data.vendor || '',
            contract_name: result.data.contract_name || '',
            start_date: result.data.start_date || '',
            end_date: result.data.end_date || '',
            value: result.data.value || '',
            contact_email: result.data.contact_email || '',
            category: result.data.category || '',
            auto_renewal: result.data.auto_renewal || false,
            notice_period_days: result.data.notice_period_days || null,
            description: result.data.description || ''
          }));
          
          // Clear any existing errors
          setErrors({});
        } else {
          // AI extracted data but some required fields are missing
          setExtractionError(`AI extraction partially successful but missing required fields: ${validation.errors.join(', ')}`);
          setShowManualFallback(true);
          
          // Still populate what we can INCLUDING DESCRIPTION
          setFormData(prev => ({
            ...prev,
            vendor: result.data.vendor || '',
            contract_name: result.data.contract_name || '',
            start_date: result.data.start_date || '',
            end_date: result.data.end_date || '',
            value: result.data.value || '',
            contact_email: result.data.contact_email || '',
            category: result.data.category || '',
            auto_renewal: result.data.auto_renewal || false,
            notice_period_days: result.data.notice_period_days || null,
            description: result.data.description || ''
          }));
        }
      } else {
        setExtractionError(result.error || 'Failed to extract contract details');
        setShowManualFallback(true);
      }
    } catch (error) {
      console.error('AI extraction error:', error);
      setExtractionError('Error extracting contract details. Manual entry required.');
      setShowManualFallback(true);
    } finally {
      setExtracting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const contractData = {
        ...formData,
        value: formData.value ? parseFloat(formData.value) : null
        // PDF functionality removed for now - can be added back later
      };

      console.log('Creating contract with data:', contractData);
      console.log('User email:', user.emailAddresses[0].emailAddress);
      console.log('PDF file:', uploadedFile);
      
      const result = await contractService.createContract(
        contractData, 
        user.emailAddresses[0].emailAddress,
        uploadedFile?.file || null
      );
      console.log('Contract created successfully:', result);
      
      onSave(result);
      handleClose();
    } catch (error) {
      console.error('Error creating contract:', error);
      console.error('Error details:', error.message);
      
      // Check if it's a contract limit error
      if (error.message && error.message.includes('Contract limit reached')) {
        setUpgradePromptData({
          title: 'Contract Limit Reached',
          message: `You've reached your limit of 2 contracts on the Free plan. Upgrade to add more contracts and unlock additional features.`,
          features: ['Up to 50 contracts', 'Team collaboration', 'Custom reminders']
        });
        setShowUpgradePrompt(true);
      } else {
        alert(`Error creating contract: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      vendor: '',
      contract_name: '',
      start_date: '',
      end_date: '',
      value: '',
      contact_email: '',
      category: '',
      auto_renewal: false,
      notice_period_days: null,
      description: ''
    });
    setErrors({});
    setUploadedFile(null);
    setShowManualFallback(false);
    setExtractionError(null);
    setExtracting(false);
    setShowUpgradePrompt(false);
    setShowLimitWarning(false);
    setContractLimitInfo(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-black/50 backdrop-blur-sm" onClick={handleClose}></div>
        
        <div className="inline-block px-6 pt-6 pb-6 overflow-hidden text-left align-bottom transition-all transform bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">
                Add New Contract
              </h3>
              <p className="text-slate-600 mt-1">
                {!uploadedFile && !showManualFallback 
                  ? 'Upload your contract PDF and AI will automatically extract all the details'
                  : 'Review and confirm the contract details below'
                }
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-slate-100/50 backdrop-blur-sm rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>

          {/* Contract Limit Warning */}
          {showLimitWarning && contractLimitInfo && (
            <div className={`mb-6 p-4 rounded-lg border ${
              contractLimitInfo.type === 'warning' 
                ? 'bg-yellow-50 border-yellow-200 text-yellow-800' 
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {contractLimitInfo.type === 'warning' ? (
                    <svg className="h-5 w-5 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{contractLimitInfo.title}</h4>
                  <p className="text-sm mt-1">{contractLimitInfo.message}</p>
                </div>
                <button
                  onClick={() => setShowLimitWarning(false)}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Manual Entry Toggle - Only show when needed */}
          {showManualFallback && (
            <div className="mb-6">
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setShowManualFallback(false)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50/80 backdrop-blur-sm border border-blue-200/50 rounded-lg hover:bg-blue-100/80 transition-colors"
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Try AI Extraction Again
                </button>
              </div>
            </div>
          )}
          
          {/* PDF Upload Section - Show first */}
          {!uploadedFile && !showManualFallback && (
            <div className="mb-8">
              <div className="text-center">
                <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl flex items-center justify-center mb-6">
                  <Brain className="h-12 w-12 text-blue-600" />
                </div>
                <h4 className="text-xl font-semibold text-slate-900 mb-2">
                  AI-Powered Contract Extraction
                </h4>
                <p className="text-slate-600 mb-6 max-w-md mx-auto">
                  Simply upload your contract PDF and our AI will automatically extract all the details including vendor, dates, value, and contact information.
                </p>
                
                <div 
                  className={`mt-1 flex justify-center px-6 pt-8 pb-8 border-2 border-dashed rounded-xl transition-all duration-200 backdrop-blur-sm ${
                    isDragOver 
                      ? 'border-blue-400 bg-blue-50/50 scale-105' 
                      : 'border-slate-300/50 hover:border-slate-400/50 bg-slate-50/30'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="space-y-1 text-center">
                    <Upload className={`mx-auto h-16 w-16 transition-colors ${
                      isDragOver ? 'text-blue-500' : 'text-slate-400'
                    }`} />
                    <div className="flex text-sm text-slate-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white/80 backdrop-blur-sm rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                      >
                        <span>Upload Contract PDF</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          accept=".pdf"
                          onChange={handleFileUpload}
                          disabled={uploadingFile}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-slate-500">PDF up to 10MB</p>
                    {isDragOver && (
                      <p className="text-sm text-blue-600 font-medium animate-pulse">
                        Drop your PDF here!
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Manual Entry Option */}
          {!uploadedFile && !showManualFallback && (
            <div className="text-center mb-6">
              <button
                type="button"
                onClick={() => setShowManualFallback(true)}
                className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                Or enter details manually
              </button>
            </div>
          )}

          {/* Contract Form - Show after PDF upload or manual fallback */}
          {(uploadedFile || showManualFallback) && (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Vendor */}
              <div className="md:col-span-2">
                <label htmlFor="vendor" className="block text-sm font-semibold text-slate-700 mb-2">
                  Vendor *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    name="vendor"
                    id="vendor"
                    value={formData.vendor}
                    onChange={handleInputChange}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors bg-white/80 backdrop-blur-sm ${errors.vendor ? 'border-red-300/50 bg-red-50/80' : 'border-slate-300/50 hover:border-slate-400/50'}`}
                    placeholder="e.g., Microsoft, AWS, Datto"
                  />
                </div>
                {errors.vendor && <p className="mt-2 text-sm text-red-600">{errors.vendor}</p>}
              </div>

              {/* Contract Name */}
              <div className="md:col-span-2">
                <label htmlFor="contract_name" className="block text-sm font-semibold text-slate-700 mb-2">
                  Contract Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FileText className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    name="contract_name"
                    id="contract_name"
                    value={formData.contract_name}
                    onChange={handleInputChange}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors bg-white/80 backdrop-blur-sm ${errors.contract_name ? 'border-red-300/50 bg-red-50/80' : 'border-slate-300/50 hover:border-slate-400/50'}`}
                    placeholder="e.g., Office 365 Business Premium"
                  />
                </div>
                {errors.contract_name && <p className="mt-2 text-sm text-red-600">{errors.contract_name}</p>}
              </div>

              {/* Start Date */}
              <div>
                <label htmlFor="start_date" className="block text-sm font-semibold text-slate-700 mb-2">
                  Start Date *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="date"
                    name="start_date"
                    id="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors bg-white/80 backdrop-blur-sm ${errors.start_date ? 'border-red-300/50 bg-red-50/80' : 'border-slate-300/50 hover:border-slate-400/50'}`}
                  />
                </div>
                {errors.start_date && <p className="mt-2 text-sm text-red-600">{errors.start_date}</p>}
              </div>

              {/* End Date */}
              <div>
                <label htmlFor="end_date" className="block text-sm font-semibold text-slate-700 mb-2">
                  End Date *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="date"
                    name="end_date"
                    id="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors bg-white/80 backdrop-blur-sm ${errors.end_date ? 'border-red-300/50 bg-red-50/80' : 'border-slate-300/50 hover:border-slate-400/50'}`}
                  />
                </div>
                {errors.end_date && <p className="mt-2 text-sm text-red-600">{errors.end_date}</p>}
              </div>

              {/* Contract Value */}
              <div>
                <label htmlFor="value" className="block text-sm font-semibold text-slate-700 mb-2">
                  Contract Value (USD)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="number"
                    name="value"
                    id="value"
                    value={formData.value}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-300/50 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors hover:border-slate-400/50 bg-white/80 backdrop-blur-sm"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              {/* Contact Email */}
              <div>
                <label htmlFor="contact_email" className="block text-sm font-semibold text-slate-700 mb-2">
                  Contact Email *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    name="contact_email"
                    id="contact_email"
                    value={formData.contact_email}
                    onChange={handleInputChange}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors bg-white/80 backdrop-blur-sm ${errors.contact_email ? 'border-red-300/50 bg-red-50/80' : 'border-slate-300/50 hover:border-slate-400/50'}`}
                    placeholder="contact@vendor.com"
                  />
                </div>
                {errors.contact_email && <p className="mt-2 text-sm text-red-600">{errors.contact_email}</p>}
              </div>

              {/* AI Extraction Status */}
              {uploadedFile && (
                <div className="md:col-span-2">
                  <div className="bg-slate-50/80 backdrop-blur-sm border border-slate-200/50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-8 w-8 text-green-500" />
                        <div>
                          <p className="font-medium text-slate-900">{uploadedFile.name}</p>
                          <p className="text-sm text-slate-500">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedFile(null);
                          setExtractionError(null);
                          setShowManualFallback(false);
                          setFormData({
                            vendor: '',
                            contract_name: '',
                            start_date: '',
                            end_date: '',
                            value: '',
                            contact_email: ''
                          });
                        }}
                        className="p-2 hover:bg-red-100/50 backdrop-blur-sm rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                    
                    {/* Extraction Status */}
                    {extracting && (
                      <div className="mt-4 flex items-center space-x-3">
                        <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">AI is analyzing your contract...</p>
                          <p className="text-xs text-slate-500">Extracting contract details</p>
                        </div>
                      </div>
                    )}
                    
                    {!extracting && uploadedFile && (
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() => handleAIExtraction(uploadedFile.file)}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50/80 backdrop-blur-sm border border-blue-200/50 rounded-lg hover:bg-blue-100/80 transition-colors"
                        >
                          <Brain className="h-4 w-4 mr-2" />
                          Re-analyze Contract
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* AI Extraction Error */}
                  {extractionError && (
                    <div className="mt-4 p-4 bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                            <X className="h-4 w-4 text-red-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-900">AI Extraction Failed</p>
                          <p className="text-sm text-red-700 mt-1">{extractionError}</p>
                          <p className="text-xs text-red-600 mt-2">
                            Please fill in the details manually below or try uploading a different PDF.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* AI Extraction Success */}
                  {!extracting && !extractionError && uploadedFile && (
                    <div className="mt-4 p-4 bg-green-50/80 backdrop-blur-sm border border-green-200/50 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <Brain className="h-4 w-4 text-green-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-900">AI Extraction Completed!</p>
                          <p className="text-sm text-green-700 mt-1">
                            Contract details have been automatically extracted and filled in below.
                          </p>
                          <p className="text-xs text-green-600 mt-2">
                            Please review and make any necessary corrections before submitting.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-slate-200/50">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-3 text-sm font-semibold text-slate-700 bg-white/80 backdrop-blur-sm border border-slate-300/50 rounded-xl hover:bg-slate-50/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 text-sm font-semibold text-white bg-blue-600/90 backdrop-blur-sm border border-transparent rounded-xl hover:bg-blue-700/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Creating...' : 'Create Contract'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      
      {/* Upgrade Prompt */}
      <UpgradePrompt
        isOpen={showUpgradePrompt}
        onClose={() => {
          setShowUpgradePrompt(false);
          handleClose(); // Close the entire modal when upgrade prompt is closed
        }}
        title={upgradePromptData.title}
        message={upgradePromptData.message}
        features={upgradePromptData.features}
        ctaText={upgradePromptData.cta || "Upgrade Now"}
      />
    </div>
  );
}

export default AddContractModal;