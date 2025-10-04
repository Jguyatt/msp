import React from 'react';
import { format } from 'date-fns';
import { 
  MoreHorizontal,
  FileText,
  Download
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
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gradient-to-r from-slate-50/80 to-gray-50/80 backdrop-blur-sm border-b border-slate-200/50">
            <tr>
              {!compact && (
                <th className="px-8 py-6 text-left">
                  <input
                    type="checkbox"
                    checked={contracts.filter(c => c && c.id).length > 0 && selectedContracts.length === contracts.filter(c => c && c.id).length}
                    onChange={(e) => onSelectAll && onSelectAll(e.target.checked)}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-slate-300/50 rounded-md shadow-sm bg-white/80 backdrop-blur-sm"
                  />
                </th>
              )}
              <th className="px-8 py-6 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">
                Vendor
              </th>
              <th className="px-8 py-6 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">
                Contract
              </th>
              <th className="px-8 py-6 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">
                End Date
              </th>
              <th className="px-8 py-6 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">
                Days Until Expiry
              </th>
              <th className="px-8 py-6 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">
                PDF
              </th>
              <th className="px-8 py-6 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white/50 backdrop-blur-sm">
                {contracts.filter(contract => contract && contract.id).map((contract, index) => (
                  <tr
                    key={contract.id}
                    className="hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-indigo-50/80 backdrop-blur-sm transition-all duration-300 border-b border-slate-100/50 last:border-b-0 group"
                  >
                    {/* Checkbox */}
                    {!compact && (
                      <td className="px-8 py-6 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedContracts.includes(contract.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            onSelectContract && onSelectContract(contract.id, e.target.checked);
                          }}
                          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-slate-300/50 rounded-md shadow-sm bg-white/80 backdrop-blur-sm"
                        />
                      </td>
                    )}
                    {/* Vendor */}
                    <td className="px-8 py-6 whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onContractClick(contract);
                        }}
                        className="font-semibold text-blue-600 hover:text-blue-800 cursor-pointer transition-all duration-200 hover:underline text-left"
                      >
                        {contract.vendor}
                      </button>
                    </td>

                    {/* Contract */}
                    <td className="px-8 py-6 whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onContractClick(contract);
                        }}
                        className="text-sm font-semibold text-slate-900 hover:text-blue-600 cursor-pointer transition-all duration-200 hover:underline text-left"
                      >
                        {contract.contract_name || contract.contractName}
                      </button>
                    </td>

                    {/* End Date */}
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-600">
                        {(() => {
                          try {
                            const dateValue = contract.end_date || contract.endDate;
                            if (!dateValue) return 'N/A';
                            const date = new Date(dateValue);
                            if (isNaN(date.getTime())) return 'Invalid Date';
                            return format(date, 'MMM dd, yyyy');
                          } catch (error) {
                            console.error('Date formatting error:', error, 'Date value:', contract.end_date || contract.endDate);
                            return 'Invalid Date';
                          }
                        })()}
                      </div>
                    </td>

                    {/* Days Until Expiry */}
                    <td className="px-8 py-6 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm ${colorForDaysUntil(contract.daysUntil || 0)}`}>
                        {contract.daysUntil || 0} days
                      </span>
                    </td>

                    {/* PDF */}
                    <td className="px-8 py-6 whitespace-nowrap">
                      {contract.contract_pdf_url ? (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(contract.contract_pdf_url, '_blank');
                            }}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
                            title="View PDF"
                          >
                            <FileText className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const link = document.createElement('a');
                              link.href = contract.contract_pdf_url;
                              link.download = `${contract.vendor}_${contract.contract_name}.pdf`;
                              link.click();
                            }}
                            className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-all duration-200 group"
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">No PDF</span>
                      )}
                    </td>


                    {/* Actions */}
                    <td className="px-8 py-6 whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onContractClick(contract);
                        }}
                        className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200 group"
                        aria-label="View Details"
                      >
                        <MoreHorizontal className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                      </button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ContractsTable;