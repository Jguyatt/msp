import React, { useState, useEffect } from 'react';
import { Bell, Calendar, Mail, Clock, CheckCircle2, AlertTriangle, Filter, Download, Plus } from 'lucide-react';
import { format } from 'date-fns';

function RemindersPage() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'pending', 'sent', 'overdue'
  const [selectedReminders, setSelectedReminders] = useState([]);

  useEffect(() => {
    // Mock reminders data - in real app, fetch from API
    const mockReminders = [
      {
        id: 1,
        contractId: 'f2f3a7af-d5a7-4dce-a251-02b1b229faa6',
        contractName: 'Test Contract',
        vendor: 'Test Vendor',
        endDate: '2024-12-31',
        reminderType: '90_day',
        status: 'overdue',
        scheduledDate: '2024-10-02',
        sentDate: null,
        recipient: 'client@company.com',
        daysUntilExpiry: -269
      },
      {
        id: 2,
        contractId: 'f2f3a7af-d5a7-4dce-a251-02b1b229faa6',
        contractName: 'Test Contract',
        vendor: 'Test Vendor',
        endDate: '2024-12-31',
        reminderType: '60_day',
        status: 'overdue',
        scheduledDate: '2024-11-01',
        sentDate: null,
        recipient: 'client@company.com',
        daysUntilExpiry: -269
      },
      {
        id: 3,
        contractId: 'f2f3a7af-d5a7-4dce-a251-02b1b229faa6',
        contractName: 'Test Contract',
        vendor: 'Test Vendor',
        endDate: '2024-12-31',
        reminderType: '30_day',
        status: 'overdue',
        scheduledDate: '2024-12-01',
        sentDate: null,
        recipient: 'client@company.com',
        daysUntilExpiry: -269
      },
      {
        id: 4,
        contractId: 'contract-2',
        contractName: 'Microsoft Office 365',
        vendor: 'Microsoft',
        endDate: '2025-03-15',
        reminderType: '90_day',
        status: 'pending',
        scheduledDate: '2024-12-16',
        sentDate: null,
        recipient: 'admin@company.com',
        daysUntilExpiry: 45
      },
      {
        id: 5,
        contractId: 'contract-3',
        contractName: 'AWS Enterprise',
        vendor: 'Amazon Web Services',
        endDate: '2025-06-30',
        reminderType: '90_day',
        status: 'sent',
        scheduledDate: '2025-04-01',
        sentDate: '2025-04-01T09:00:00Z',
        recipient: 'tech@company.com',
        daysUntilExpiry: 120
      }
    ];

    setTimeout(() => {
      setReminders(mockReminders);
      setLoading(false);
    }, 500);
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'sent':
        return 'Sent';
      case 'pending':
        return 'Pending';
      case 'overdue':
        return 'Overdue';
      default:
        return 'Unknown';
    }
  };

  const filteredReminders = reminders.filter(reminder => {
    if (filterStatus === 'all') return true;
    return reminder.status === filterStatus;
  });

  const handleSelectReminder = (reminderId, isSelected) => {
    if (isSelected) {
      setSelectedReminders(prev => [...prev, reminderId]);
    } else {
      setSelectedReminders(prev => prev.filter(id => id !== reminderId));
    }
  };

  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      setSelectedReminders(filteredReminders.map(reminder => reminder.id));
    } else {
      setSelectedReminders([]);
    }
  };

  const handleBulkAction = (action) => {
    if (selectedReminders.length === 0) return;
    
    switch (action) {
      case 'send':
        alert(`Sending ${selectedReminders.length} reminder(s)...`);
        break;
      case 'reschedule':
        alert(`Rescheduling ${selectedReminders.length} reminder(s)...`);
        break;
      case 'delete':
        if (confirm(`Delete ${selectedReminders.length} reminder(s)?`)) {
          setReminders(prev => prev.filter(reminder => !selectedReminders.includes(reminder.id)));
          setSelectedReminders([]);
        }
        break;
    }
  };

  const handleExportReminders = () => {
    const remindersToExport = selectedReminders.length > 0 
      ? reminders.filter(reminder => selectedReminders.includes(reminder.id))
      : filteredReminders;

    const headers = ['Contract', 'Vendor', 'End Date', 'Reminder Type', 'Status', 'Scheduled Date', 'Sent Date', 'Recipient'];
    
    const csvContent = [
      headers.join(','),
      ...remindersToExport.map(reminder => [
        reminder.contractName,
        reminder.vendor,
        reminder.endDate,
        reminder.reminderType,
        reminder.status,
        reminder.scheduledDate,
        reminder.sentDate || '',
        reminder.recipient
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reminders-export-${new Date().toISOString().split('T')[0]}.csv`;
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
              <h1 className="text-2xl font-bold text-gray-900">Reminder Management</h1>
              <p className="mt-2 text-gray-600">
                Track and manage contract renewal reminders
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleExportReminders}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="h-4 w-4" />
                Add Reminder
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Reminders</p>
                  <p className="text-2xl font-bold text-gray-900">{reminders.length}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Bell className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{reminders.filter(r => r.status === 'pending').length}</p>
                </div>
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sent</p>
                  <p className="text-2xl font-bold text-green-600">{reminders.filter(r => r.status === 'sent').length}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">{reminders.filter(r => r.status === 'overdue').length}</p>
                </div>
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  List View
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'calendar' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Calendar View
                </button>
              </div>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="sent">Sent</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            {/* Bulk Actions */}
            {selectedReminders.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {selectedReminders.length} selected
                </span>
                <button
                  onClick={() => handleBulkAction('send')}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Send
                </button>
                <button
                  onClick={() => handleBulkAction('reschedule')}
                  className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                  Reschedule
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Reminders Table */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900">All Reminders</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={filteredReminders.length > 0 && selectedReminders.length === filteredReminders.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contract
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reminder Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scheduled Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sent Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReminders.map((reminder) => (
                  <tr key={reminder.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <input
                        type="checkbox"
                        checked={selectedReminders.includes(reminder.id)}
                        onChange={(e) => handleSelectReminder(reminder.id, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div>
                        <div className="font-medium text-gray-900">{reminder.contractName}</div>
                        <div className="text-gray-500">{reminder.vendor}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reminder.reminderType.replace('_', ' ').toUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(reminder.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reminder.status)}`}>
                          {getStatusLabel(reminder.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(reminder.scheduledDate), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reminder.sentDate ? format(new Date(reminder.sentDate), 'MMM dd, yyyy') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reminder.recipient}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        {reminder.status === 'pending' && (
                          <button className="text-blue-600 hover:text-blue-800 text-sm">
                            Send Now
                          </button>
                        )}
                        <button className="text-gray-600 hover:text-gray-800 text-sm">
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredReminders.length === 0 && (
          <div className="text-center py-12">
            <Bell className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No reminders found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filterStatus === 'all' 
                ? 'No reminders have been created yet.'
                : `No reminders with status "${filterStatus}" found.`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default RemindersPage;
