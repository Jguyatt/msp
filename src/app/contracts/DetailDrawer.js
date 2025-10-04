import React, { useState, useEffect } from 'react';
import { X, Mail, Calendar, User, CheckCircle2, Clock, AlertCircle, Settings, FileText, Download, Eye, Brain, ClipboardList, MessageCircle } from 'lucide-react';
import { formatDate, formatCurrency } from '../utils/formatters';
import ReminderSettings from '../components/ReminderSettings';
import EditContractModal from '../components/EditContractModal';
// ContractClauses import removed
import RFPTemplate from '../components/RFPTemplate';
import ChatAssistant from '../components/ChatAssistant';
import { contractService } from '../../services/supabaseService';

function DetailDrawer({ contract, onClose, onContractUpdate }) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('view');
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentContract, setCurrentContract] = useState(contract);
  // Clause-related state removed
  const [allContracts, setAllContracts] = useState([]);
  const [reAnalyzing, setReAnalyzing] = useState(false);

  const closeDrawer = () => {
    setIsOpen(false);
    setTimeout(onClose, 300); // Wait for animation
  };

  const handleContractUpdated = (updatedContract) => {
    setCurrentContract(updatedContract);
    onContractUpdate && onContractUpdate(updatedContract);
    setShowEditModal(false);
  };

  const handleReAnalyzeContract = async () => {
    if (!currentContract?.id) return;
    
    setReAnalyzing(true);
    
    try {
      const response = await fetch(`http://localhost:3002/api/contracts/${currentContract.id}/re-analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to re-analyze contract');
      }

      const result = await response.json();
      console.log('Re-analysis completed:', result);
      
      // Refresh the contract data
      const updatedContract = {
        ...currentContract,
        ...result.extractedData,
        analysis_completed_at: new Date().toISOString()
      };
      
      setCurrentContract(updatedContract);
      onContractUpdate && onContractUpdate(updatedContract);
      
      alert('Contract re-analyzed successfully!');
      
    } catch (error) {
      console.error('Error re-analyzing contract:', error);
      alert(`Failed to re-analyze contract: ${error.message}`);
    } finally {
      setReAnalyzing(false);
    }
  };

  // Close drawer when clicking outside
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeDrawer();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

        // Clause analysis useEffect removed

  // Fetch all contracts for chat assistant context
  useEffect(() => {
    const fetchAllContracts = async () => {
      try {
        const contracts = await contractService.getContractsForUser();
        setAllContracts(contracts || []);
      } catch (error) {
        console.error('Error fetching all contracts:', error);
        setAllContracts([]);
      }
    };

    fetchAllContracts();
  }, []);

  const getStatusIcon = (reminder) => {
    if (reminder && reminder.sentAt) {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    } else {
      return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusText = (reminder, type) => {
    if (reminder && reminder.sentAt) {
      return `Sent on ${formatDate(reminder.sentAt)}`;
    } else {
      return `Pending - will be sent ${type} days before expiry`;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50" 
            onClick={closeDrawer}
          />
          
          {/* Slide-in drawer */}
          <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
            <div className="w-screen max-w-2xl transform transition-transform duration-300 ease-in-out">
              <div className="h-full bg-white shadow-xl overflow-y-auto">
                {/* Header */}
                <div className="bg-white border-b border-slate-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {contract.vendor.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                          {contract.vendor}
                        </h2>
                        <p className="text-sm text-slate-600">{contract.id}</p>
                      </div>
                    </div>
                    <button
                      onClick={closeDrawer}
                      className="text-slate-400 hover:text-slate-600"
                      aria-label="Close drawer"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-slate-200">
                  <div className="flex">
        {[
          { id: 'summary', label: 'Summary', icon: Calendar, shortLabel: 'Sum' },
          { id: 'rfp', label: 'RFP Template', icon: ClipboardList, shortLabel: 'RFP' },
          { id: 'chat', label: 'Assistant', icon: MessageCircle, shortLabel: 'Chat' },
          { id: 'reminders', label: 'Reminders', icon: Settings, shortLabel: 'Alert' },
          { id: 'view', label: 'View Contract', icon: FileText, shortLabel: 'PDF' }
        ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1 px-2 py-2 text-xs font-medium border-b-2 transition-colors flex-1 min-w-0 ${
                          activeTab === tab.id
                            ? 'border-blue-600 text-blue-600 bg-blue-50'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                        title={tab.label}
                      >
                        <tab.icon className="h-3 w-3 flex-shrink-0" />
                        <span className="text-xs truncate">{tab.shortLabel}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 max-w-full overflow-hidden">
                  {activeTab === 'summary' && (
                    <div className="space-y-6">
                      {/* Contract Details */}
                      <div className="grid grid-cols-1 gap-4">
                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-600">Contract Name</p>
                            <p className="text-lg font-semibold text-slate-900">
                              {currentContract.contract_name || currentContract.contractName}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <FileText className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-600">Contract Value</p>
                            <p className="text-lg font-semibold text-slate-900">
                              {formatCurrency(currentContract.value || 0)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <AlertCircle className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-600">Days Until Expiry</p>
                            <p className="text-lg font-semibold text-slate-900">
                              {currentContract.daysUntil || 0} days
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* AI-Generated Contract Summary */}
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200/50 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Brain className="h-5 w-5 text-blue-600" />
                          </div>
                          <h3 className="text-lg font-bold text-slate-900">AI Contract Summary</h3>
                        </div>
                        
                        {currentContract.description ? (
                          <div className="space-y-4">
                            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg border border-blue-200/30">
                              <p className="text-sm text-slate-700 leading-relaxed">
                                {currentContract.description}
                              </p>
                            </div>
                            
                            {/* Key Contract Terms */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-white/60 p-3 rounded-lg">
                                <div className="text-xs text-blue-600 font-semibold mb-1">Category</div>
                                <div className="text-sm font-medium text-slate-900">{currentContract.category || 'Not specified'}</div>
                              </div>
                              <div className="bg-white/60 p-3 rounded-lg">
                                <div className="text-xs text-blue-600 font-semibold mb-1">Auto-Renewal</div>
                                <div className="text-sm font-medium text-slate-900">
                                  {currentContract.auto_renewal ? 'Yes' : 'No'}
                                </div>
                              </div>
                              {currentContract.notice_period_days && (
                                <div className="bg-white/60 p-3 rounded-lg col-span-2">
                                  <div className="text-xs text-blue-600 font-semibold mb-1">Notice Period</div>
                                  <div className="text-sm font-medium text-slate-900">
                                    {currentContract.notice_period_days} days before renewal
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* AI Insights */}
                            {(currentContract.auto_renewal || currentContract.daysUntil < 90) && (
                              <div className="bg-yellow-50/80 border border-yellow-200/50 rounded-lg p-4">
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <div className="text-sm font-semibold text-yellow-900 mb-1">AI Insights</div>
                                    <ul className="text-sm text-yellow-800 space-y-1">
                                      {currentContract.auto_renewal && (
                                        <li>• This contract has auto-renewal enabled - review before {formatDate(currentContract.end_date)}</li>
                                      )}
                                      {currentContract.daysUntil < 90 && (
                                        <li>• Contract expires in {currentContract.daysUntil} days - consider renegotiation opportunities</li>
                                      )}
                                      {currentContract.value > 1000 && (
                                        <li>• High-value contract - potential for volume discount negotiation</li>
                                      )}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-white/60 p-6 rounded-lg border border-blue-200/30 text-center">
                            <AlertCircle className="h-8 w-8 text-blue-400 mx-auto mb-3" />
                            <p className="text-sm text-slate-600 mb-3">
                              No AI summary available for this contract.
                            </p>
                            <button
                              onClick={handleReAnalyzeContract}
                              disabled={reAnalyzing}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium"
                            >
                              {reAnalyzing ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  Analyzing...
                                </>
                              ) : (
                                <>
                                  <Brain className="h-4 w-4" />
                                  Generate AI Summary
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Key Dates */}
                      <div className="bg-white border border-slate-200 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Key Dates</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">Start Date</span>
                            <span className="text-sm font-medium text-slate-900">
                              {formatDate(currentContract.start_date || currentContract.startDate)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">End Date</span>
                            <span className="text-sm font-medium text-slate-900">
                              {formatDate(currentContract.end_date || currentContract.endDate)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">Last Updated</span>
                            <span className="text-sm font-medium text-slate-900">
                              {formatDate(currentContract.updated_at || new Date())}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowEditModal(true)}
                          className="flex-1 bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
                        >
                          Edit Contract
                        </button>
                        <button className="flex-1 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors">
                          Send Reminder
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Clauses tab removed */}


                  {activeTab === 'rfp' && (
                    <div className="space-y-4 max-w-full overflow-hidden">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-semibold text-slate-900 truncate">RFP Template</h3>
                          <p className="text-sm text-slate-600 mt-1 truncate">
                            AI-generated RFP template with contract metadata and benchmarks
                          </p>
                        </div>
                      </div>
                      
                      <div className="max-w-full overflow-hidden">
                        <RFPTemplate 
                          contract={currentContract}
                          clauseData={null}
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === 'chat' && (
                    <div className="space-y-4 max-w-full overflow-hidden">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-semibold text-slate-900 truncate">Contract Assistant</h3>
                          <p className="text-sm text-slate-600 mt-1 truncate">
                            Ask questions about your contracts and get AI-powered insights
                          </p>
                        </div>
                      </div>
                      
                      <div className="max-w-full overflow-hidden">
                        <ChatAssistant 
                          contract={currentContract}
                          allContracts={allContracts}
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === 'reminders' && (
                    <ReminderSettings contract={currentContract} onSave={(settings) => {
                      console.log('Reminder settings saved:', settings);
                      alert('Reminder settings saved successfully!');
                    }} />
                  )}

                  {activeTab === 'view' && (
                    <div className="p-6">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 mb-4">Contract Document</h3>
                          
                          {currentContract.contract_pdf_url ? (
                            <div className="space-y-4">
                              {/* PDF Viewer */}
                              <div className="border border-slate-200 rounded-lg overflow-hidden">
                                <iframe
                                  src={currentContract.contract_pdf_url}
                                  className="w-full h-96"
                                  title="Contract PDF"
                                />
                              </div>
                              
                              {/* Action Buttons */}
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => window.open(currentContract.contract_pdf_url, '_blank')}
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                  <Eye className="h-4 w-4" />
                                  Open in New Tab
                                </button>
                                <button
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = currentContract.contract_pdf_url;
                                    link.download = `${currentContract.vendor}_${currentContract.contract_name}.pdf`;
                                    link.click();
                                  }}
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                                >
                                  <Download className="h-4 w-4" />
                                  Download PDF
                                </button>
                              </div>
                              
                              {/* File Info */}
                              <div className="bg-slate-50 rounded-lg p-4">
                                <h4 className="font-medium text-slate-900 mb-2">File Information</h4>
                                <div className="text-sm text-slate-600 space-y-1">
                                  <p><span className="font-medium">Contract:</span> {currentContract.contract_name}</p>
                                  <p><span className="font-medium">Vendor:</span> {currentContract.vendor}</p>
                                  <p><span className="font-medium">Status:</span> <span className="text-green-600">Available</span></p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-12">
                              <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                              <h4 className="text-lg font-medium text-slate-900 mb-2">No Contract Document</h4>
                              <p className="text-slate-500 mb-4">This contract doesn't have a PDF document attached.</p>
                              <button
                                onClick={() => setShowEditModal(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                <FileText className="h-4 w-4" />
                                Upload Document
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Contract Modal */}
      <EditContractModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleContractUpdated}
        contract={currentContract}
      />
    </>
  );
}

export default DetailDrawer;