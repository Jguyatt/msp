import React, { useState, useEffect } from 'react';
import { History, User, Edit, Plus, Trash2, Upload, Mail, Eye, Filter, Download, Search, Calendar } from 'lucide-react';
import { format } from 'date-fns';

function AuditTrailPage() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [selectedLogs, setSelectedLogs] = useState([]);

  useEffect(() => {
    // Mock audit logs - in real app, fetch from API
    const mockLogs = [
      {
        id: 1,
        action: 'contract_created',
        actor: 'John Smith',
        actorEmail: 'john@company.com',
        timestamp: '2024-01-15T10:30:00Z',
        details: 'Contract uploaded via CSV',
        contractId: 'f2f3a7af-d5a7-4dce-a251-02b1b229faa6',
        contractName: 'Test Contract',
        vendor: 'Test Vendor',
        changes: {
          vendor: null,
          contract_name: null,
          end_date: null,
          value: null
        }
      },
      {
        id: 2,
        action: 'contract_updated',
        actor: 'Sarah Johnson',
        actorEmail: 'sarah@company.com',
        timestamp: '2024-01-16T14:20:00Z',
        details: 'Updated contract end date',
        contractId: 'f2f3a7af-d5a7-4dce-a251-02b1b229faa6',
        contractName: 'Test Contract',
        vendor: 'Test Vendor',
        changes: {
          end_date: {
            from: '2024-12-31',
            to: '2025-01-15'
          }
        }
      },
      {
        id: 3,
        action: 'reminder_sent',
        actor: 'System',
        actorEmail: 'system@renewaltracker.com',
        timestamp: '2024-01-20T09:00:00Z',
        details: '90-day reminder email sent',
        contractId: 'f2f3a7af-d5a7-4dce-a251-02b1b229faa6',
        contractName: 'Test Contract',
        vendor: 'Test Vendor',
        changes: {
          reminder_type: '90_day',
          recipient: 'client@company.com'
        }
      },
      {
        id: 4,
        action: 'contract_viewed',
        actor: 'Mike Wilson',
        actorEmail: 'mike@company.com',
        timestamp: '2024-01-22T16:45:00Z',
        details: 'Contract details viewed',
        contractId: 'f2f3a7af-d5a7-4dce-a251-02b1b229faa6',
        contractName: 'Test Contract',
        vendor: 'Test Vendor',
        changes: {}
      },
      {
        id: 5,
        action: 'contract_created',
        actor: 'Alice Brown',
        actorEmail: 'alice@company.com',
        timestamp: '2024-01-25T11:15:00Z',
        details: 'New contract added manually',
        contractId: 'contract-2',
        contractName: 'Microsoft Office 365',
        vendor: 'Microsoft',
        changes: {
          vendor: 'Microsoft',
          contract_name: 'Microsoft Office 365',
          end_date: '2025-03-15',
          value: 5000
        }
      },
      {
        id: 6,
        action: 'contract_deleted',
        actor: 'John Smith',
        actorEmail: 'john@company.com',
        timestamp: '2024-01-28T09:30:00Z',
        details: 'Contract deleted',
        contractId: 'contract-3',
        contractName: 'Old Service Contract',
        vendor: 'Legacy Vendor',
        changes: {}
      }
    ];

    setTimeout(() => {
      setAuditLogs(mockLogs);
      setLoading(false);
    }, 500);
  }, []);

  const getActionIcon = (action) => {
    switch (action) {
      case 'contract_created':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'contract_updated':
        return <Edit className="h-4 w-4 text-blue-600" />;
      case 'contract_deleted':
        return <Trash2 className="h-4 w-4 text-red-600" />;
      case 'contract_uploaded':
        return <Upload className="h-4 w-4 text-purple-600" />;
      case 'reminder_sent':
        return <Mail className="h-4 w-4 text-orange-600" />;
      case 'contract_viewed':
        return <Eye className="h-4 w-4 text-gray-600" />;
      default:
        return <History className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'contract_created':
        return 'bg-green-100 text-green-800';
      case 'contract_updated':
        return 'bg-blue-100 text-blue-800';
      case 'contract_deleted':
        return 'bg-red-100 text-red-800';
      case 'contract_uploaded':
        return 'bg-purple-100 text-purple-800';
      case 'reminder_sent':
        return 'bg-orange-100 text-orange-800';
      case 'contract_viewed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionLabel = (action) => {
    switch (action) {
      case 'contract_created':
        return 'Contract Created';
      case 'contract_updated':
        return 'Contract Updated';
      case 'contract_deleted':
        return 'Contract Deleted';
      case 'contract_uploaded':
        return 'Contract Uploaded';
      case 'reminder_sent':
        return 'Reminder Sent';
      case 'contract_viewed':
        return 'Contract Viewed';
      default:
        return 'Action Performed';
    }
  };

  const formatChanges = (changes) => {
    if (!changes || Object.keys(changes).length === 0) return null;
    
    return Object.entries(changes).map(([field, change]) => {
      if (typeof change === 'object' && change.from !== undefined) {
        return (
          <div key={field} className="text-xs text-gray-600">
            <span className="font-medium">{field.replace('_', ' ')}:</span> "{change.from}" → "{change.to}"
          </div>
        );
      }
      return (
        <div key={field} className="text-xs text-gray-600">
          <span className="font-medium">{field.replace('_', ' ')}:</span> {change}
        </div>
      );
    });
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.contractName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    
    // Date filter logic (simplified for demo)
    const matchesDate = filterDate === 'all' || true; // In real app, implement date filtering
    
    return matchesSearch && matchesAction && matchesDate;
  });

  const handleSelectLog = (logId, isSelected) => {
    if (isSelected) {
      setSelectedLogs(prev => [...prev, logId]);
    } else {
      setSelectedLogs(prev => prev.filter(id => id !== logId));
    }
  };

  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      setSelectedLogs(filteredLogs.map(log => log.id));
    } else {
      setSelectedLogs([]);
    }
  };

  const handleExportLogs = () => {
    const logsToExport = selectedLogs.length > 0 
      ? auditLogs.filter(log => selectedLogs.includes(log.id))
      : filteredLogs;

    const headers = ['Timestamp', 'Action', 'Actor', 'Contract', 'Vendor', 'Details', 'Changes'];
    
    const csvContent = [
      headers.join(','),
      ...logsToExport.map(log => [
        format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss'),
        getActionLabel(log.action),
        log.actor,
        log.contractName,
        log.vendor,
        log.details,
        JSON.stringify(log.changes)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Audit Trail</h1>
              <p className="mt-2 text-gray-600">
                Complete history of all contract-related activities and changes
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleExportLogs}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Actions</p>
                  <p className="text-2xl font-bold text-gray-900">{auditLogs.length}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <History className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Contract Changes</p>
                  <p className="text-2xl font-bold text-blue-600">{auditLogs.filter(l => l.action.includes('contract')).length}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Edit className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Reminders Sent</p>
                  <p className="text-2xl font-bold text-orange-600">{auditLogs.filter(l => l.action === 'reminder_sent').length}</p>
                </div>
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Mail className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Unique Users</p>
                  <p className="text-2xl font-bold text-green-600">{new Set(auditLogs.map(l => l.actor)).size}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <User className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            {/* Search */}
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search contracts, vendors, users, or details..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>

            {/* Action Filter */}
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Actions</option>
              <option value="contract_created">Contract Created</option>
              <option value="contract_updated">Contract Updated</option>
              <option value="contract_deleted">Contract Deleted</option>
              <option value="contract_uploaded">Contract Uploaded</option>
              <option value="reminder_sent">Reminder Sent</option>
              <option value="contract_viewed">Contract Viewed</option>
            </select>

            {/* Date Filter */}
            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>

        {/* Audit Logs */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Activity Log</h3>
              {selectedLogs.length > 0 && (
                <span className="text-sm text-gray-600">
                  {selectedLogs.length} selected
                </span>
              )}
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getActionIcon(log.action)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                          {getActionLabel(log.action)}
                        </span>
                        {log.actor !== 'System' && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <User className="h-3 w-3" />
                            {log.actor}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{log.details}</p>
                      <div className="text-xs text-gray-500 mt-1">
                        Contract: {log.contractName} ({log.vendor})
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm')}
                  </div>
                </div>

                {log.changes && Object.keys(log.changes).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-xs font-medium text-gray-600 mb-2">Changes:</div>
                    <div className="space-y-1">
                      {formatChanges(log.changes)}
                    </div>
                  </div>
                )}

                {log.actor !== 'System' && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                      Actor: {log.actorEmail}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-12">
            <History className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No audit logs found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterAction !== 'all' 
                ? 'No logs match your current filters.'
                : 'No activity has been recorded yet.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuditTrailPage;
