import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, ArrowRight, Filter, Download, MoreHorizontal, Calendar, AlertTriangle, CheckCircle2, Trash2, UploadCloud } from 'lucide-react';
import ContractsTable from './ContractsTable';
import DetailDrawer from './DetailDrawer';
import AddContractModal from '../components/AddContractModal';
import EmptyState from '../components/EmptyState';
import { contractService } from '../../services/supabaseService';
import { useUserSync } from '../../hooks/useUserSync';

// Utility function to format time ago
const formatTimeAgo = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  return `${Math.floor(diffInSeconds / 2592000)} months ago`;
};

function ContractsPage({ isCompact = false }) {
  const { clerkUser, supabaseUser, loading: userLoading, error: userError } = useUserSync();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedContract, setSelectedContract] = useState(null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContracts, setSelectedContracts] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch contracts from Supabase
  useEffect(() => {
    const fetchContracts = async () => {
      if (userLoading || !clerkUser || !supabaseUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Use the user's email to get their contracts
        const data = await contractService.getContractsForUser(clerkUser.emailAddresses[0].emailAddress);
        
        // Transform data to match expected format
        const transformedContracts = data.map(contract => {
          const endDate = new Date(contract.end_date);
          const today = new Date();
          const daysUntil = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
          
          return {
            ...contract,
            daysUntil,
            reminders: {
              d90: contract.reminders?.find(r => r.days_before_expiry === 90)?.status === 'sent',
              d60: contract.reminders?.find(r => r.days_before_expiry === 60)?.status === 'sent',
              d30: contract.reminders?.find(r => r.days_before_expiry === 30)?.status === 'sent'
            }
          };
        });
        
        setContracts(transformedContracts);
      } catch (error) {
        console.error('Error fetching contracts from Supabase:', error);
        setContracts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, [clerkUser, supabaseUser, userLoading]);

  const filteredContracts = useMemo(() => {
    if (!searchTerm) return contracts;
    
    return contracts.filter(contract => 
      contract.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.contract_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.id.toString().includes(searchTerm.toLowerCase())
    );
  }, [contracts, searchTerm]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (value) {
        newParams.set('search', value);
      } else {
        newParams.delete('search');
      }
      return newParams;
    });
  };

  const handleAddContract = () => {
    setShowAddModal(true);
  };

  const handleContractSaved = (newContract) => {
    // Add the new contract to the list
    setContracts(prev => [newContract, ...prev]);
    setShowAddModal(false);
  };

  const handleDeleteContract = async (contractId) => {
    try {
      const response = await fetch('http://localhost:3001/api/contracts', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractIds: [contractId]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to delete contract');
      }

      // Remove from local state
      setContracts(prev => prev.filter(contract => contract.id !== contractId));
      
      // Show success message
      alert('Contract deleted successfully!');
    } catch (error) {
      console.error('Error deleting contract:', error);
      alert('Error deleting contract. Please try again.');
    }
  };

  const handleContractUpdate = (updatedContract) => {
    // Update the contract in the list
    setContracts(prev => prev.map(contract => 
      contract.id === updatedContract.id ? updatedContract : contract
    ));
  };

  const handleSelectContract = (contractId, isSelected) => {
    if (isSelected) {
      setSelectedContracts(prev => [...prev, contractId]);
    } else {
      setSelectedContracts(prev => prev.filter(id => id !== contractId));
    }
  };

  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      setSelectedContracts(filteredContracts.map(contract => contract.id));
    } else {
      setSelectedContracts([]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedContracts.length === 0) return;
    setShowDeleteModal(true);
  };

  const handleExportContracts = () => {
    const contractsToExport = selectedContracts.length > 0 
      ? contracts.filter(contract => selectedContracts.includes(contract.id))
      : filteredContracts;

    const headers = ['Vendor', 'Contract Name', 'Start Date', 'End Date', 'Value (USD)', 'Days Until Expiry', 'Reminder Status'];
    
    const csvContent = [
      headers.join(','),
      ...contractsToExport.map(contract => [
        contract.vendor,
        contract.contract_name || contract.contractName,
        contract.start_date || contract.startDate,
        contract.end_date || contract.endDate,
        contract.value || 0,
        contract.daysUntil || 0,
        `${contract.reminders.d90 ? '90d✓' : '90d✗'}, ${contract.reminders.d60 ? '60d✓' : '60d✗'}, ${contract.reminders.d30 ? '30d✓' : '30d✗'}`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contracts-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const confirmDelete = async () => {
    try {
      // Delete contracts from Supabase
      await contractService.deleteContracts(selectedContracts);
      
      // Remove from local state
      setContracts(prev => prev.filter(contract => !selectedContracts.includes(contract.id)));
      setSelectedContracts([]);
      setShowDeleteModal(false);
      
      // Show success message
      alert(`Successfully deleted ${selectedContracts.length} contract(s)`);
    } catch (error) {
      console.error('Error deleting contracts:', error);
      alert('Error deleting contracts. Please try again.');
    }
  };

  const contractsToShow = isCompact ? filteredContracts.slice(0, 5) : filteredContracts;

  if (loading) {
    return (
      <div className="bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-start justify-between mb-8">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                {isCompact ? 'Recent Contracts' : 'Contract Management'}
              </h1>
              <p className="mt-3 text-lg text-slate-600 leading-relaxed">
                {isCompact 
                  ? 'Latest contract activity and renewals'
                  : 'Comprehensive contract tracking, renewal management, and automated reminders'
                }
              </p>
            </div>
                {!isCompact && (
                  <div className="flex items-center gap-3 ml-8">
                    <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-slate-700 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 font-medium">
                      <Filter className="h-4 w-4" />
                      Filter
                    </button>
                    <button 
                      onClick={handleExportContracts}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-slate-700 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 font-medium"
                    >
                      <Download className="h-4 w-4" />
                      Export
                    </button>
                    {selectedContracts.length > 0 && (
                      <button
                        onClick={handleBulkDelete}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete ({selectedContracts.length})
                      </button>
                    )}
                    <button
                      onClick={handleAddContract}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                    >
                      <Plus className="h-4 w-4" />
                      Add Contract
                    </button>
                  </div>
                )}
          </div>

          {/* Stats Cards */}
          {!isCompact && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Total Contracts</p>
                    <p className="text-3xl font-bold text-slate-900">{contracts.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-slate-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Expiring Soon</p>
                    <p className="text-3xl font-bold text-red-600">{contracts.filter(c => c.daysUntil <= 30).length}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">This Month</p>
                    <p className="text-3xl font-bold text-orange-600">{contracts.filter(c => c.daysUntil <= 60).length}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Renewal Rate</p>
                    <p className="text-3xl font-bold text-green-600">94%</p>
                  </div>
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                    <ArrowRight className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Search contracts, vendors, or contract names..."
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent text-slate-900 placeholder-slate-500 transition-all duration-200"
                />
              </div>
            </div>
            {!isCompact && (
              <div className="flex items-center gap-3">
                <button className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all duration-200">
                  All Status
                </button>
                <button className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all duration-200">
                  All Vendors
                </button>
                <button className="px-3 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all duration-200">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

            {/* Contracts Table */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    {isCompact ? 'Quick Actions & Activity' : 'All Contracts'}
                  </h3>
                  {isCompact && (
                    <div className="text-sm text-gray-500">
                      Common tasks and recent updates
                    </div>
                  )}
                </div>
              </div>
              
              {/* Show empty state if no contracts */}
              {contracts.length === 0 ? (
                <EmptyState
                  title="No contracts yet"
                  description="Get started by adding your first contract to begin tracking renewals and managing your agreements."
                  primaryAction={{
                    label: "Add Your First Contract",
                    icon: Plus,
                    onClick: handleAddContract
                  }}
                  secondaryAction={{
                    label: "Upload CSV",
                    icon: UploadCloud,
                    onClick: () => window.location.href = '/app/upload'
                  }}
                />
              ) : isCompact ? (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Quick Actions */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h4>
                      
                      <button 
                        onClick={handleAddContract}
                        className="w-full flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"
                      >
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                          <Plus className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Add New Contract</p>
                          <p className="text-xs text-gray-500">Manually enter contract details</p>
                        </div>
                      </button>
                      
                      <button 
                        onClick={() => window.location.href = '/app/upload'}
                        className="w-full flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left"
                      >
                        <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                          <UploadCloud className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Upload CSV</p>
                          <p className="text-xs text-gray-500">Bulk import contracts from file</p>
                        </div>
                      </button>
                      
                      <button 
                        onClick={handleExportContracts}
                        className="w-full flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left"
                      >
                        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                          <Download className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Export Data</p>
                          <p className="text-xs text-gray-500">Download contracts as CSV</p>
                        </div>
                      </button>
                    </div>
                    
                    {/* Recent Activity */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Recent Activity</h4>
                      
                      <div className="space-y-3">
                        {(() => {
                          // Get recent contracts (last 5) and format as activity
                          const recentContracts = contracts
                            .sort((a, b) => new Date(b.created_at || b.id) - new Date(a.created_at || a.id))
                            .slice(0, 5);
                          
                          if (recentContracts.length === 0) {
                            return (
                              <div className="text-center py-4">
                                <p className="text-xs text-gray-500">No recent activity</p>
                              </div>
                            );
                          }
                          
                          return recentContracts.map((contract, index) => {
                            const timeAgo = formatTimeAgo(contract.created_at || new Date(Date.now() - index * 24 * 60 * 60 * 1000));
                            const isOverdue = contract.daysUntil < 0;
                            const isUrgent = contract.daysUntil <= 30 && contract.daysUntil >= 0;
                            const isSoon = contract.daysUntil <= 90 && contract.daysUntil > 30;
                            
                            let color = 'gray';
                            let action = 'Contract added';
                            
                            if (isOverdue) {
                              color = 'red';
                              action = 'Contract expired';
                            } else if (isUrgent) {
                              color = 'orange';
                              action = 'Contract expiring soon';
                            } else if (isSoon) {
                              color = 'yellow';
                              action = 'Contract expiring';
                            } else {
                              color = 'green';
                              action = 'Contract added';
                            }
                            
                            return (
                              <div key={contract.id} className="flex items-center gap-3 p-2">
                                <div className={`w-2 h-2 bg-${color}-500 rounded-full`}></div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-gray-900 truncate">
                                    {action}: {contract.vendor}
                                  </p>
                                  <p className="text-xs text-gray-500">{timeAgo}</p>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <ContractsTable 
                  contracts={contractsToShow}
                  onContractClick={setSelectedContract}
                  compact={isCompact}
                  selectedContracts={selectedContracts}
                  onSelectContract={handleSelectContract}
                  onSelectAll={handleSelectAll}
                />
              )}
            </div>

        {/* Show more link for compact view */}
        {isCompact && contracts.length > 0 && (
          <div className="mt-6 text-center">
            <button 
              onClick={() => window.location.href = '/app/contracts'}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View All Contracts
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

          {/* Detail Drawer */}
          {selectedContract && (
            <DetailDrawer 
              contract={selectedContract}
              onClose={() => setSelectedContract(null)}
              onContractUpdate={handleContractUpdate}
            />
          )}

          {/* Add Contract Modal */}
          <AddContractModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onSave={handleContractSaved}
          />

          {/* Delete Confirmation Modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowDeleteModal(false)}></div>
                
                <div className="inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                  <div className="sm:flex sm:items-start">
                    <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 mx-auto bg-red-100 rounded-full sm:mx-0 sm:h-10 sm:w-10">
                      <Trash2 className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">
                        Delete Contracts
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Are you sure you want to delete {selectedContracts.length} contract(s)? This action cannot be undone.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      onClick={confirmDelete}
                      className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(false)}
                      className="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    export default ContractsPage;
