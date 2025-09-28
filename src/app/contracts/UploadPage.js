import React, { useState } from 'react';
import { UploadCloud, Download, AlertCircle, CheckCircle2, FileText, ArrowRight, Shield, Zap, Users, Calendar, Plus, X, Trash2 } from 'lucide-react';

function UploadPage() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState('csv'); // 'csv' or 'pdf'
  const [pdfFiles, setPdfFiles] = useState([]);
  const [contractDetails, setContractDetails] = useState({});

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setError('');
        setMessage('');
      } else {
        setError('Please select a CSV file');
        setFile(null);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv'))) {
      setFile(droppedFile);
      setMessage('');
      setError('');
    } else {
      setError('Please drop a CSV file.');
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = `Vendor,Contract Name,Start Date,End Date,Value (USD),Contact Email
Microsoft,Office 365 Business Premium,2024-01-01,2025-01-01,1500.00,admin@company.com
Datto,Datto Backup & Recovery,2024-06-01,2025-06-01,2400.00,admin@company.com
ConnectWise,ConnectWise Manage,2024-03-01,2025-03-01,3600.00,admin@company.com`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contracts-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handlePdfUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => file.type === 'application/pdf');
    
    if (validFiles.length !== files.length) {
      setError('Please select only PDF files');
      return;
    }

    validFiles.forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        setError(`File ${file.name} is too large. Maximum size is 10MB.`);
        return;
      }

      const fileId = Date.now() + Math.random();
      const newFile = {
        id: fileId,
        file: file,
        name: file.name,
        size: file.size,
        uploaded: false,
        url: null
      };

      setPdfFiles(prev => [...prev, newFile]);
      
      // Initialize contract details for this file
      setContractDetails(prev => ({
        ...prev,
        [fileId]: {
          vendor: '',
          contract_name: '',
          start_date: '',
          end_date: '',
          value: '',
          contact_email: ''
        }
      }));
    });

    setError('');
  };

  const removePdfFile = (fileId) => {
    setPdfFiles(prev => prev.filter(f => f.id !== fileId));
    setContractDetails(prev => {
      const newDetails = { ...prev };
      delete newDetails[fileId];
      return newDetails;
    });
  };

  const updateContractDetail = (fileId, field, value) => {
    setContractDetails(prev => ({
      ...prev,
      [fileId]: {
        ...prev[fileId],
        [field]: value
      }
    }));
  };

  const uploadPdfFile = async (fileId) => {
    const pdfFile = pdfFiles.find(f => f.id === fileId);
    const details = contractDetails[fileId];

    if (!pdfFile || !details) return;

    // Validate required fields
    if (!details.vendor || !details.contract_name || !details.start_date || !details.end_date || !details.contact_email) {
      setError('Please fill in all required contract details');
      return;
    }

    try {
      // Upload PDF first
      const formData = new FormData();
      formData.append('contract_pdf', pdfFile.file);

      const uploadResponse = await fetch('http://localhost:3001/api/upload-contract-pdf', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload PDF');
      }

      const uploadResult = await uploadResponse.json();

      // Create contract with PDF reference
      const contractData = {
        ...details,
        value: parseFloat(details.value) || 0,
        status: 'active',
        contract_pdf_id: uploadResult.id,
        contract_pdf_url: uploadResult.url
      };

      const contractResponse = await fetch('http://localhost:3001/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contractData)
      });

      if (!contractResponse.ok) {
        throw new Error('Failed to create contract');
      }

      // Mark file as uploaded
      setPdfFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, uploaded: true, url: uploadResult.url } : f
      ));

      setMessage(`Successfully uploaded contract: ${details.contract_name}`);
      setError('');

    } catch (error) {
      console.error('Error uploading PDF contract:', error);
      setError(`Failed to upload ${pdfFile.name}: ${error.message}`);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setMessage('Uploading...');
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:3001/api/contracts/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Successfully uploaded ${data.count} contracts from ${file.name}`);
        setFile(null);
      } else {
        if (data.errors && data.errors.length > 0) {
          setError(`CSV validation failed: ${data.errors.length} errors found`);
          console.error('Detailed CSV errors:', data.errors);
        } else {
          setError(data.error || 'Upload failed');
        }
      }
      
      const fileInput = document.getElementById('file');
      if (fileInput) fileInput.value = '';
      
    } catch (err) {
      console.error('Network or server error:', err);
      setError('Network error or server is unreachable.');
    } finally {
      setUploading(false);
      setMessage('');
    }
  };

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Upload Contracts</h1>
          <p className="mt-2 text-gray-600">
            Import your contract data in bulk using CSV or upload individual PDF contracts. Get started in minutes with automated validation and processing.
          </p>
          
          {/* Upload Mode Toggle */}
          <div className="mt-6">
            <div className="inline-flex items-center bg-white rounded-lg p-1 shadow-sm border border-gray-200">
              <button
                onClick={() => setUploadMode('csv')}
                className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                  uploadMode === 'csv'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Bulk CSV Upload
              </button>
              <button
                onClick={() => setUploadMode('pdf')}
                className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                  uploadMode === 'pdf'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Individual PDF Upload
              </button>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure & Validated</h3>
            <p className="text-gray-600">Automatic data validation ensures accuracy and prevents errors.</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Zap className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Instant Processing</h3>
            <p className="text-gray-600">Fast CSV parsing with real-time feedback and error reporting.</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Bulk Import</h3>
            <p className="text-gray-600">Upload hundreds of contracts at once with our optimized system.</p>
          </div>
        </div>

        {/* Integrations Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-8">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Popular MSP Tool Integrations</h3>
            <p className="text-sm text-gray-600">Connect directly with your existing tools</p>
          </div>
          
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
            {/* ConnectWise */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center hover:shadow-md transition-shadow duration-200">
              <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <img 
                  src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@develop/icons/connectwise.svg" 
                  alt="ConnectWise"
                  className="w-10 h-10"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center" style={{display: 'none'}}>
                  <span className="text-white font-bold text-xs">CW</span>
                </div>
              </div>
              <h4 className="text-xs font-medium text-gray-900 mb-1">ConnectWise</h4>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                Soon
              </span>
            </div>

            {/* Microsoft */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center hover:shadow-md transition-shadow duration-200">
              <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <img 
                  src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@develop/icons/microsoft.svg" 
                  alt="Microsoft"
                  className="w-10 h-10"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center" style={{display: 'none'}}>
                  <span className="text-white font-bold text-xs">MS</span>
                </div>
              </div>
              <h4 className="text-xs font-medium text-gray-900 mb-1">Microsoft</h4>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                Soon
              </span>
            </div>

            {/* Datto */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center hover:shadow-md transition-shadow duration-200">
              <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Datto_logo.svg/256px-Datto_logo.svg.png" 
                  alt="Datto"
                  className="w-10 h-10"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center" style={{display: 'none'}}>
                  <span className="text-white font-bold text-xs">D</span>
                </div>
              </div>
              <h4 className="text-xs font-medium text-gray-900 mb-1">Datto</h4>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                Soon
              </span>
            </div>

            {/* Salesforce */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center hover:shadow-md transition-shadow duration-200">
              <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <img 
                  src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@develop/icons/salesforce.svg" 
                  alt="Salesforce"
                  className="w-10 h-10"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="w-10 h-10 bg-blue-400 rounded-lg flex items-center justify-center" style={{display: 'none'}}>
                  <span className="text-white font-bold text-xs">SF</span>
                </div>
              </div>
              <h4 className="text-xs font-medium text-gray-900 mb-1">Salesforce</h4>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                Soon
              </span>
            </div>

            {/* AWS */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center hover:shadow-md transition-shadow duration-200">
              <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <img 
                  src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@develop/icons/amazonaws.svg" 
                  alt="AWS"
                  className="w-10 h-10"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center" style={{display: 'none'}}>
                  <span className="text-white font-bold text-xs">AWS</span>
                </div>
              </div>
              <h4 className="text-xs font-medium text-gray-900 mb-1">AWS</h4>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                Soon
              </span>
            </div>

            {/* Google Cloud */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center hover:shadow-md transition-shadow duration-200">
              <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <img 
                  src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@develop/icons/googlecloud.svg" 
                  alt="Google Cloud"
                  className="w-10 h-10"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center" style={{display: 'none'}}>
                  <span className="text-white font-bold text-xs">GC</span>
                </div>
              </div>
              <h4 className="text-xs font-medium text-gray-900 mb-1">Google Cloud</h4>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                Soon
              </span>
            </div>

            {/* VMware */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center hover:shadow-md transition-shadow duration-200">
              <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <img 
                  src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@develop/icons/vmware.svg" 
                  alt="VMware"
                  className="w-10 h-10"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center" style={{display: 'none'}}>
                  <span className="text-white font-bold text-xs">VM</span>
                </div>
              </div>
              <h4 className="text-xs font-medium text-gray-900 mb-1">VMware</h4>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                Soon
              </span>
            </div>

            {/* Kaseya */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center hover:shadow-md transition-shadow duration-200">
              <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Kaseya_logo.svg/256px-Kaseya_logo.svg.png" 
                  alt="Kaseya"
                  className="w-10 h-10"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center" style={{display: 'none'}}>
                  <span className="text-white font-bold text-xs">K</span>
                </div>
              </div>
              <h4 className="text-xs font-medium text-gray-900 mb-1">Kaseya</h4>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                Soon
              </span>
            </div>

            {/* More Tools */}
            <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 text-center hover:shadow-md transition-shadow duration-200">
              <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">+</span>
                </div>
              </div>
              <h4 className="text-xs font-medium text-gray-900 mb-1">More</h4>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                Request
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Upload */}
          <div className="space-y-6">
            {uploadMode === 'csv' ? (
              <>
                {/* Step 1: Download Template */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <div className="flex items-center mb-6">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm mr-4">1</div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Download Template</h2>
                      <p className="text-gray-600">Get the CSV template with proper formatting</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="h-6 w-6 text-gray-600 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">contracts-template.csv</p>
                          <p className="text-sm text-gray-500">3 sample contracts included</p>
                        </div>
                      </div>
                      <button
                        onClick={handleDownloadTemplate}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </button>
                    </div>
                  </div>
                </div>

                {/* Step 2: Upload CSV */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <div className="flex items-center mb-6">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm mr-4">2</div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Upload Your Data</h2>
                      <p className="text-gray-600">Drag & drop or select your CSV file</p>
                    </div>
                  </div>

                  <form onSubmit={handleUpload} className="space-y-6">
                    {/* Drag & Drop Area */}
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                        isDragging 
                          ? 'border-blue-400 bg-blue-50' 
                          : file 
                            ? 'border-green-400 bg-green-50' 
                            : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                      }`}
                    >
                      <input
                        id="file"
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      
                      <div className="space-y-4">
                        <div className="mx-auto w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          <UploadCloud className={`h-6 w-6 ${file ? 'text-green-600' : 'text-gray-600'}`} />
                        </div>
                        
                        {file ? (
                          <div>
                            <p className="text-lg font-medium text-green-600">File Selected</p>
                            <p className="text-green-700">{file.name}</p>
                            <p className="text-sm text-gray-500 mt-2">Click to select a different file</p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-lg font-medium text-gray-900">
                              {isDragging ? 'Drop your CSV file here' : 'Drag & drop your CSV file'}
                            </p>
                            <p className="text-gray-600">or click to browse</p>
                            <p className="text-sm text-gray-500 mt-2">Maximum file size: 10MB</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status Messages */}
                    {error && (
                      <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-red-800">Upload Failed</p>
                          <p className="text-red-700 text-sm">{error}</p>
                        </div>
                      </div>
                    )}

                    {message && !error && (
                      <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-green-800">Upload Successful</p>
                          <p className="text-green-700 text-sm">{message}</p>
                        </div>
                      </div>
                    )}

                    {/* Upload Button */}
                    <button
                      type="submit"
                      disabled={!file || uploading}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <UploadCloud className="h-4 w-4" />
                          Upload Contracts
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <>
                {/* PDF Upload Section */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <div className="flex items-center mb-6">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm mr-4">1</div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Upload PDF Contracts</h2>
                      <p className="text-gray-600">Select one or more PDF contract files</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* PDF File Input */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                      <input
                        type="file"
                        accept=".pdf"
                        multiple
                        onChange={handlePdfUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        id="pdf-upload"
                      />
                      <label htmlFor="pdf-upload" className="cursor-pointer">
                        <div className="space-y-4">
                          <div className="mx-auto w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                            <FileText className="h-6 w-6 text-gray-600" />
                          </div>
                          <div>
                            <p className="text-lg font-medium text-gray-900">
                              Click to select PDF files
                            </p>
                            <p className="text-gray-600">or drag & drop multiple files</p>
                            <p className="text-sm text-gray-500 mt-2">Maximum file size: 10MB each</p>
                          </div>
                        </div>
                      </label>
                    </div>

                    {/* Status Messages */}
                    {error && (
                      <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-red-800">Error</p>
                          <p className="text-red-700 text-sm">{error}</p>
                        </div>
                      </div>
                    )}

                    {message && !error && (
                      <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-green-800">Success</p>
                          <p className="text-green-700 text-sm">{message}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* PDF Files List */}
                {pdfFiles.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <div className="flex items-center mb-6">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm mr-4">2</div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Contract Details</h2>
                        <p className="text-gray-600">Fill in details for each uploaded PDF</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {pdfFiles.map((pdfFile) => (
                        <div key={pdfFile.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <FileText className="h-8 w-8 text-red-600" />
                              <div>
                                <p className="font-medium text-gray-900">{pdfFile.name}</p>
                                <p className="text-sm text-gray-500">{formatFileSize(pdfFile.size)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {pdfFile.uploaded && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Uploaded
                                </span>
                              )}
                              <button
                                onClick={() => removePdfFile(pdfFile.id)}
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {!pdfFile.uploaded && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor *</label>
                                <input
                                  type="text"
                                  value={contractDetails[pdfFile.id]?.vendor || ''}
                                  onChange={(e) => updateContractDetail(pdfFile.id, 'vendor', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="e.g., Microsoft, AWS"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contract Name *</label>
                                <input
                                  type="text"
                                  value={contractDetails[pdfFile.id]?.contract_name || ''}
                                  onChange={(e) => updateContractDetail(pdfFile.id, 'contract_name', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="e.g., Office 365 Business"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                                <input
                                  type="date"
                                  value={contractDetails[pdfFile.id]?.start_date || ''}
                                  onChange={(e) => updateContractDetail(pdfFile.id, 'start_date', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                                <input
                                  type="date"
                                  value={contractDetails[pdfFile.id]?.end_date || ''}
                                  onChange={(e) => updateContractDetail(pdfFile.id, 'end_date', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Value (USD)</label>
                                <input
                                  type="number"
                                  value={contractDetails[pdfFile.id]?.value || ''}
                                  onChange={(e) => updateContractDetail(pdfFile.id, 'value', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="0.00"
                                  min="0"
                                  step="0.01"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email *</label>
                                <input
                                  type="email"
                                  value={contractDetails[pdfFile.id]?.contact_email || ''}
                                  onChange={(e) => updateContractDetail(pdfFile.id, 'contact_email', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="contact@vendor.com"
                                />
                              </div>
                            </div>
                          )}

                          {!pdfFile.uploaded && (
                            <div className="mt-4 flex justify-end">
                              <button
                                onClick={() => uploadPdfFile(pdfFile.id)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                <UploadCloud className="h-4 w-4" />
                                Upload Contract
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Column - Requirements & Help */}
          <div className="space-y-6">
            {/* Format Requirements */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                {uploadMode === 'csv' ? 'CSV Format Requirements' : 'PDF Upload Requirements'}
              </h3>
              
              {uploadMode === 'csv' ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">1</div>
                    <div>
                      <p className="font-medium text-gray-900">Vendor</p>
                      <p className="text-sm text-gray-600">Company name (required)</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">2</div>
                    <div>
                      <p className="font-medium text-gray-900">Contract Name</p>
                      <p className="text-sm text-gray-600">Contract identifier (required)</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">3</div>
                    <div>
                      <p className="font-medium text-gray-900">Start Date</p>
                      <p className="text-sm text-gray-600">YYYY-MM-DD format (required)</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">4</div>
                    <div>
                      <p className="font-medium text-gray-900">End Date</p>
                      <p className="text-sm text-gray-600">YYYY-MM-DD format (required)</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">5</div>
                    <div>
                      <p className="font-medium text-gray-900">Value (USD)</p>
                      <p className="text-sm text-gray-600">Contract value in USD (required)</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">6</div>
                    <div>
                      <p className="font-medium text-gray-900">Contact Email</p>
                      <p className="text-sm text-gray-600">Valid email address (required)</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">1</div>
                    <div>
                      <p className="font-medium text-gray-900">PDF File Format</p>
                      <p className="text-sm text-gray-600">Only PDF files are accepted</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">2</div>
                    <div>
                      <p className="font-medium text-gray-900">File Size</p>
                      <p className="text-sm text-gray-600">Maximum 10MB per file</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">3</div>
                    <div>
                      <p className="font-medium text-gray-900">Contract Details</p>
                      <p className="text-sm text-gray-600">Fill in all required fields for each PDF</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">4</div>
                    <div>
                      <p className="font-medium text-gray-900">Individual Upload</p>
                      <p className="text-sm text-gray-600">Each PDF creates a separate contract</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">5</div>
                    <div>
                      <p className="font-medium text-gray-900">Document Storage</p>
                      <p className="text-sm text-gray-600">PDFs are securely stored and linked to contracts</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">6</div>
                    <div>
                      <p className="font-medium text-gray-900">Bulk Upload</p>
                      <p className="text-sm text-gray-600">Select multiple PDFs at once for efficiency</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Pro Tips</h3>
              {uploadMode === 'csv' ? (
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Save your CSV as UTF-8 encoding for best compatibility</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Use the exact column headers from our template</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Dates should be in YYYY-MM-DD format (e.g., 2024-12-31)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Remove any empty rows before uploading</span>
                  </li>
                </ul>
              ) : (
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Use descriptive filenames for easy identification</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Fill in all required fields before uploading each PDF</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Upload multiple PDFs at once for efficiency</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">PDFs are securely stored and accessible anytime</span>
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UploadPage;