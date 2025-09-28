import React, { useState, useEffect } from 'react';
import { X, Mail, Calendar, DollarSign, User, CheckCircle2, Clock, AlertCircle, Settings, History } from 'lucide-react';
import { formatDate, formatCurrency } from '../utils/formatters';
import AuditTrail from '../components/AuditTrail';
import ReminderSettings from '../components/ReminderSettings';
import EditContractModal from '../components/EditContractModal';

function DetailDrawer({ contract, onClose, onContractUpdate }) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentContract, setCurrentContract] = useState(contract);

  const closeDrawer = () => {
    setIsOpen(false);
    setTimeout(onClose, 300); // Wait for animation
  };

  const handleContractUpdated = (updatedContract) => {
    setCurrentContract(updatedContract);
    onContractUpdate && onContractUpdate(updatedContract);
    setShowEditModal(false);
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
            <div className="w-screen max-w-md transform transition-transform duration-300 ease-in-out">
              <div className="h-full bg-white shadow-xl overflow-y-auto">
                {/* Header */}
                <div className="bg-white border-b border-slate-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
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
                      { id: 'summary', label: 'Summary', icon: Calendar },
                      { id: 'reminders', label: 'Reminders', icon: Settings },
                      { id: 'audit', label: 'Audit Trail', icon: History }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                          activeTab === tab.id
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
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
                            <DollarSign className="h-5 w-5 text-green-600" />
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
                              {currentContract.daysUntil} days
                            </p>
                          </div>
                        </div>
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
                          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Edit Contract
                        </button>
                        <button className="flex-1 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors">
                          Send Reminder
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'reminders' && (
                    <ReminderSettings contract={currentContract} onSave={(settings) => {
                      console.log('Reminder settings saved:', settings);
                      alert('Reminder settings saved successfully!');
                    }} />
                  )}

                  {activeTab === 'audit' && (
                    <AuditTrail contractId={currentContract.id} />
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