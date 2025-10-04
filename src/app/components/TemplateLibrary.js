import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  Trash2, 
  Edit3, 
  Plus, 
  X, 
  Download,
  Eye,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { renewalPacketService } from '../../services/renewalPacketService';
import { awsUploadService } from '../../services/awsUploadService';

/**
 * Template Library Component
 * Allows users to upload and manage contract templates for renewal packets
 */
function TemplateLibrary({ userId, onSelectTemplate, onClose }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    if (userId) {
      loadTemplates();
    }
  }, [userId]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const templatesData = await renewalPacketService.getRenewalPacketTemplates(userId);
      setTemplates(templatesData || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await renewalPacketService.deleteRenewalPacketTemplate(templateId);
        await loadTemplates();
      } catch (error) {
        console.error('Error deleting template:', error);
        alert('Failed to delete template. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Template Library</h3>
          <p className="text-gray-600 mt-1">Upload and manage contract renewal templates</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" />
          Upload Template
        </button>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <div className="text-center py-16 px-8 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-gray-300">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center mb-6">
            <FileText className="h-12 w-12 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No templates yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Upload your first contract template to start creating renewal packets with e-signatures.
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            Upload Your First Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden group"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-xl">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{template.template_name}</h4>
                      <p className="text-sm text-gray-500">
                        {template.is_uploaded ? template.template_file_type?.toUpperCase() : 'Text Template'}
                      </p>
                    </div>
                  </div>
                </div>

                {template.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{template.description}</p>
                )}

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                  {onSelectTemplate && (
                    <button
                      onClick={() => onSelectTemplate(template)}
                      className="flex-1 px-4 py-2 bg-blue-100/80 text-blue-700 rounded-lg hover:bg-blue-200/80 transition-all duration-200 text-sm font-medium"
                    >
                      Use Template
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Template Modal */}
      {showUploadModal && (
        <UploadTemplateModal
          userId={userId}
          onClose={() => setShowUploadModal(false)}
          onUploadComplete={() => {
            setShowUploadModal(false);
            loadTemplates();
          }}
        />
      )}
    </div>
  );
}

// Upload Template Modal Component
function UploadTemplateModal({ userId, onClose, onUploadComplete }) {
  const [templateName, setTemplateName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!allowedTypes.includes(selectedFile.type)) {
        alert('Please upload a PDF, DOCX, or TXT file.');
        return;
      }
      
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB.');
        return;
      }
      
      setFile(selectedFile);
      
      // Auto-generate template name from filename if not set
      if (!templateName) {
        const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "");
        setTemplateName(nameWithoutExt);
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!file || !templateName) {
      alert('Please provide a template name and select a file.');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // Upload file to AWS S3
      const uploadResult = await awsUploadService.uploadFile(file, userId, 'templates');
      setUploadProgress(50);

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Failed to upload file');
      }

      // Get file type from file
      const fileType = file.name.split('.').pop().toLowerCase();

      // Create template record in database
      const templateData = {
        user_id: userId,
        template_name: templateName,
        description: description,
        template_file_url: uploadResult.url,
        template_file_type: fileType,
        is_uploaded: true,
        template_content: null, // No text content for uploaded files
        signature_fields: [] // Will be configured later
      };

      setUploadProgress(75);

      await renewalPacketService.saveRenewalPacketTemplate(templateData);
      setUploadProgress(100);

      alert('Template uploaded successfully!');
      onUploadComplete();
    } catch (error) {
      console.error('Error uploading template:', error);
      alert(`Failed to upload template: ${error.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-2xl border border-white/20">
        <div className="bg-white/95 backdrop-blur-md border-b border-gray-200/50 px-8 py-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
                Upload Contract Template
              </h2>
              <p className="text-gray-600 mt-2">Upload a PDF, DOCX, or TXT file</p>
            </div>
            <button 
              onClick={onClose} 
              className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100/80 rounded-xl transition-all duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-8">
          <form onSubmit={handleUpload} className="space-y-6">
            {/* Template Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Template Name *
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Standard Renewal Agreement"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
                placeholder="Describe when to use this template..."
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Upload Template File *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  id="template-file"
                  onChange={handleFileSelect}
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  required
                />
                <label htmlFor="template-file" className="cursor-pointer">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center mb-4">
                    <Upload className="h-8 w-8 text-blue-600" />
                  </div>
                  {file ? (
                    <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-semibold">{file.name}</span>
                    </div>
                  ) : (
                    <p className="text-gray-700 font-medium mb-2">Click to upload or drag and drop</p>
                  )}
                  <p className="text-sm text-gray-500">PDF, DOCX, or TXT (Max 10MB)</p>
                </label>
              </div>
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="bg-blue-50/80 backdrop-blur-sm p-4 rounded-xl border border-blue-200/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-blue-700">Uploading...</span>
                  <span className="text-sm font-semibold text-blue-700">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-blue-200/50 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={uploading}
                className="flex-1 px-6 py-3 text-gray-700 bg-gray-100/80 rounded-xl hover:bg-gray-200/80 transition-all duration-200 font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!file || !templateName || uploading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg font-semibold"
              >
                {uploading ? 'Uploading...' : 'Upload Template'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default TemplateLibrary;

