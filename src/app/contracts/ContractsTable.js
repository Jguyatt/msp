import React from 'react';
import { format } from 'date-fns';
import { 
  MoreHorizontal,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { formatDate, colorForDaysUntil } from '../utils/formatters';

function ContractsTable({ 
  contracts, 
  onContractClick, 
  compact = false, 
  selectedContracts = [], 
  onSelectContract, 
  onSelectAll
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {!compact && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={contracts.length > 0 && selectedContracts.length === contracts.length}
                    onChange={(e) => onSelectAll && onSelectAll(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
              )}
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
                Days Until Expiry
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reminder Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
                {contracts.map((contract, index) => (
                  <tr
                    key={contract.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                    onClick={() => !compact && onContractClick(contract)}
                  >
                    {/* Checkbox */}
                    {!compact && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <input
                          type="checkbox"
                          checked={selectedContracts.includes(contract.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            onSelectContract && onSelectContract(contract.id, e.target.checked);
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                    )}
                    {/* Vendor */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onContractClick(contract);
                      }}
                      className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer transition-colors duration-200"
                    >
                      {contract.vendor}
                    </button>
                </td>

                {/* Contract */}
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="text-sm font-medium text-gray-900">
                    {contract.contract_name || contract.contractName}
                  </div>
                </td>

                {/* End Date */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {format(new Date(contract.end_date || contract.endDate), 'MMM dd, yyyy')}
                </td>

                {/* Days Until Expiry */}
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorForDaysUntil(contract.daysUntil)}`}>
                    {contract.daysUntil} days
                  </span>
                </td>

                {/* Reminder Status */}
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center space-x-1">
                    {/* 90-day reminder */}
                        <div className="flex flex-col items-center">
                          <div className="w-6 h-6 flex items-center justify-center">
                            {contract.reminders.d90 ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" title="90d: sent" />
                            ) : (
                              <Clock className="h-4 w-4 text-gray-400" title="90d: pending" />
                            )}
                          </div>
                          <span className="text-xs text-gray-500">90d</span>
                        </div>
                        
                        {/* 60-day reminder */}
                        <div className="flex flex-col items-center">
                          <div className="w-6 h-6 flex items-center justify-center">
                            {contract.reminders.d60 ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" title="60d: sent" />
                            ) : (
                              <Clock className="h-4 w-4 text-gray-400" title="60d: pending" />
                            )}
                          </div>
                          <span className="text-xs text-gray-500">60d</span>
                        </div>
                        
                        {/* 30-day reminder */}
                        <div className="flex flex-col items-center">
                          <div className="w-6 h-6 flex items-center justify-center">
                            {contract.reminders.d30 ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" title="30d: sent" />
                            ) : (
                              <Clock className="h-4 w-4 text-gray-400" title="30d: pending" />
                            )}
                          </div>
                          <span className="text-xs text-gray-500">30d</span>
                        </div>
                  </div>
                </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onContractClick(contract);
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                        aria-label="View Details"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
              </tr>
            ))}
          </tbody>
        </table>
    </div>
  );
}

export default ContractsTable;