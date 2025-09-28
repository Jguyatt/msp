import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { X, Calendar, DollarSign, Mail, User, Building, Upload, FileText, Trash2 } from 'lucide-react';
import { contractService } from '../../services/supabaseService';

function AddContractModal({ isOpen, onClose, onSave }) {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    vendor: '',
    contract_name: '',
    start_date: '',
    end_date: '',
    value: '',
    contact_email: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);

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
    
    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      
      if (endDate <= startDate) {
        newErrors.end_date = 'End date must be after start date';
      }
    }
    
    if (!formData.contact_email.trim()) {
      newErrors.contact_email = 'Contact email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.contact_email)) {
        newErrors.contact_email = 'Please enter a valid email address';
      }
    }
    
    if (formData.value && isNaN(parseFloat(formData.value))) {
      newErrors.value = 'Please enter a valid number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm() || !user) {
      return;
    }
    
    setLoading(true);
    
    try {
      const contractData = {
        ...formData,
        value: parseFloat(formData.value) || 0,
        status: 'active',
        contract_pdf_id: uploadedFile?.id || null,
        contract_pdf_url: uploadedFile?.url || null
      };
      
      // Create contract in Supabase
      const newContract = await contractService.createContract(contractData, user.emailAddresses[0].emailAddress);
      
      // Reset form
      setFormData({
        vendor: '',
        contract_name: '',
        start_date: '',
        end_date: '',
        value: '',
        contact_email: ''
      });
      
      onSave(newContract);
      onClose();
      
    } catch (error) {
      console.error('Error creating contract:', error);
      setErrors({ submit: 'Failed to create contract. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      setErrors({ file: 'Please upload a PDF file only' });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrors({ file: 'File size must be less than 10MB' });
      return;
    }

    setUploadingFile(true);
    setErrors({});

    try {
      const formData = new FormData();
      formData.append('contract_pdf', file);

      const response = await fetch('http://localhost:3001/api/upload-contract-pdf', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const result = await response.json();
      setUploadedFile({
        name: file.name,
        size: file.size,
        url: result.url,
        id: result.id
      });

    } catch (error) {
      console.error('Error uploading file:', error);
      setErrors({ file: 'Failed to upload file. Please try again.' });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setErrors({});
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleClose = () => {
    setFormData({
      vendor: '',
      contract_name: '',
      start_date: '',
      end_date: '',
      value: '',
      contact_email: ''
    });
    setErrors({});
    setUploadedFile(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={handleClose}></div>
        
        <div className="inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="sm:flex sm:items-start">
            <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 mx-auto bg-blue-100 rounded-full sm:mx-0 sm:h-10 sm:w-10">
              <Building className="w-6 h-6 text-blue-600" />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Add New Contract
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Enter the contract details below. All fields marked with * are required.
                </p>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="mt-6">
            <div className="space-y-4">
              {/* Vendor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Building className="inline h-4 w-4 mr-1" />
                  Vendor *
                </label>
                <input
                  type="text"
                  name="vendor"
                  value={formData.vendor}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.vendor ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Microsoft, AWS, Datto"
                />
                {errors.vendor && (
                  <p className="mt-1 text-sm text-red-600">{errors.vendor}</p>
                )}
              </div>
              
              {/* Contract Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="inline h-4 w-4 mr-1" />
                  Contract Name *
                </label>
                <input
                  type="text"
                  name="contract_name"
                  value={formData.contract_name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.contract_name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Office 365 Business Premium"
                />
                {errors.contract_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.contract_name}</p>
                )}
              </div>
              
              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Start Date *
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.start_date ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.start_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>
                )}
              </div>
              
              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  End Date *
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.end_date ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.end_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>
                )}
              </div>
              
              {/* Contract Value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <DollarSign className="inline h-4 w-4 mr-1" />
                  Contract Value (USD)
                </label>
                <input
                  type="number"
                  name="value"
                  value={formData.value}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.value ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
                {errors.value && (
                  <p className="mt-1 text-sm text-red-600">{errors.value}</p>
                )}
              </div>
              
              {/* Contact Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail className="inline h-4 w-4 mr-1" />
                  Contact Email *
                </label>
                <input
                  type="email"
                  name="contact_email"
                  value={formData.contact_email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.contact_email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="contact@vendor.com"
                />
                {errors.contact_email && (
                  <p className="mt-1 text-sm text-red-600">{errors.contact_email}</p>
                )}
              </div>

              {/* Contract PDF Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FileText className="inline h-4 w-4 mr-1" />
                  Contract PDF (Optional)
                </label>
                
                {!uploadedFile ? (
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                      className="hidden"
                      id="contract-pdf-upload"
                    />
                    <label
                      htmlFor="contract-pdf-upload"
                      className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                        uploadingFile 
                          ? 'border-blue-300 bg-blue-50' 
                          : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      {uploadingFile ? (
                        <>
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                          <p className="text-sm text-blue-600 font-medium">Uploading...</p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600 font-medium">
                            Click to upload PDF
                          </p>
                          <p className="text-xs text-gray-500">
                            Max file size: 10MB
                          </p>
                        </>
                      )}
                    </label>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-900">{uploadedFile.name}</p>
                        <p className="text-xs text-green-600">{formatFileSize(uploadedFile.size)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-1 text-green-600 hover:text-green-800 transition-colors"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                {errors.file && (
                  <p className="mt-1 text-sm text-red-600">{errors.file}</p>
                )}
              </div>
            </div>
            
            {errors.submit && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}
            
            <div className="mt-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Contract'}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddContractModal;
