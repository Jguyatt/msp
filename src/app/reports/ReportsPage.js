import React, { useState, useEffect } from 'react';
import { Download, Calendar, DollarSign, AlertTriangle, TrendingUp, FileText, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';

function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState('expiring');
  const [dateRange, setDateRange] = useState('30');
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/contracts');
        if (response.ok) {
          const data = await response.json();
          setContracts(data.contracts || []);
        } else {
          // Fallback to mock data
          setContracts([
            {
              id: 1,
              vendor: 'Microsoft',
              contract_name: 'Office 365 Business Premium',
              end_date: '2024-02-15',
              value: 24000,
              daysUntil: 15
            },
            {
              id: 2,
              vendor: 'Datto',
              contract_name: 'Backup & Recovery',
              end_date: '2024-03-01',
              value: 18000,
              daysUntil: 30
            },
            {
              id: 3,
              vendor: 'AWS',
              contract_name: 'Enterprise Support',
              end_date: '2024-06-15',
              value: 50000,
              daysUntil: 135
            }
          ]);
        }
      } catch (error) {
        console.error('Error fetching contracts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, []);

  const getFilteredContracts = () => {
    const days = parseInt(dateRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);

    return contracts.filter(contract => {
      const endDate = new Date(contract.end_date);
      return endDate <= cutoffDate;
    });
  };

  const getTotalValue = () => {
    return contracts.reduce((sum, contract) => sum + (contract.value || 0), 0);
  };

  const getExpiringSoon = () => {
    return contracts.filter(contract => contract.daysUntil <= 30).length;
  };

  const getRenewalRate = () => {
    // Mock calculation - in real app, this would come from historical data
    return 94;
  };

  const exportToCSV = () => {
    const filteredContracts = getFilteredContracts();
    const headers = ['Vendor', 'Contract Name', 'End Date', 'Value (USD)', 'Days Until Expiry'];
    
    const csvContent = [
      headers.join(','),
      ...filteredContracts.map(contract => [
        contract.vendor,
        contract.contract_name || contract.contractName,
        contract.end_date,
        contract.value || 0,
        contract.daysUntil || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contracts-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    // In a real app, you'd use a library like jsPDF or send to backend
    alert('PDF export feature coming soon! This would generate a formatted PDF report.');
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

  const filteredContracts = getFilteredContracts();

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
              <p className="mt-2 text-gray-600">
                Track contract performance and generate detailed reports
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={exportToCSV}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
              <button
                onClick={exportToPDF}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FileText className="h-4 w-4" />
                Export PDF
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Contracts</p>
                <p className="text-2xl font-bold text-gray-900">{contracts.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${getTotalValue().toLocaleString()}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-red-600">{getExpiringSoon()}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Renewal Rate</p>
                <p className="text-2xl font-bold text-green-600">{getRenewalRate()}%</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Report Filters */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Report Filters</h3>
          </div>
          
          <div className="flex items-center gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Type
              </label>
              <select
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="expiring">Contracts Expiring Soon</option>
                <option value="value">High Value Contracts</option>
                <option value="renewals">Upcoming Renewals</option>
                <option value="all">All Contracts</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="30">Next 30 Days</option>
                <option value="60">Next 60 Days</option>
                <option value="90">Next 90 Days</option>
                <option value="365">Next Year</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contracts Table */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900">
              {selectedReport === 'expiring' && 'Contracts Expiring Soon'}
              {selectedReport === 'value' && 'High Value Contracts'}
              {selectedReport === 'renewals' && 'Upcoming Renewals'}
              {selectedReport === 'all' && 'All Contracts'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Showing {filteredContracts.length} contracts
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contract
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    End Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days Until
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {contract.vendor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {contract.contract_name || contract.contractName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {format(new Date(contract.end_date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${(contract.value || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        (contract.daysUntil || 0) < 30 
                          ? 'bg-red-100 text-red-800'
                          : (contract.daysUntil || 0) < 90 
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {contract.daysUntil || 0} days
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        (contract.daysUntil || 0) < 30 
                          ? 'bg-red-100 text-red-800'
                          : (contract.daysUntil || 0) < 90 
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {(contract.daysUntil || 0) < 30 ? 'Urgent' : 
                         (contract.daysUntil || 0) < 90 ? 'Soon' : 'Safe'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredContracts.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No contracts found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your filters to see more results.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReportsPage;
