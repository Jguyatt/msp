import React from 'react';

function KPI({ icon: Icon, label, value, sublabel, positive = false, urgent = false }) {
  const colorClasses = urgent 
    ? 'text-red-600 bg-red-50/80 border-red-200/50 backdrop-blur-sm'
    : positive 
    ? 'text-green-600 bg-green-50/80 border-green-200/50 backdrop-blur-sm'
    : 'text-blue-600 bg-blue-50/80 border-blue-200/50 backdrop-blur-sm';

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-lg p-4 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg border ${colorClasses}`}>
          <Icon className="h-5 w-5" />
        </div>
        {positive && (
          <div className="flex items-center text-green-600 text-sm font-medium">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V17a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            More
          </div>
        )}
      </div>
      
      <div className="text-2xl font-bold text-slate-900 mb-1">
        {value}
      </div>
      
      <div className="text-sm text-slate-600 mb-1">
        {label}
      </div>
      
      {sublabel && (
        <div className="text-xs text-slate-500">
          {sublabel}
        </div>
      )}
    </div>
  );
}

export default KPI;
