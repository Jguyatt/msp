import React from 'react';
import { Plus, UploadCloud, FileText } from 'lucide-react';

function EmptyState({ 
  title = "No contracts yet", 
  description = "Get started by adding your first contract",
  primaryAction,
  secondaryAction,
  icon: Icon = FileText 
}) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <Icon className="h-12 w-12 text-gray-400" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">{description}</p>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {primaryAction && (
          <button
            onClick={primaryAction.onClick}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
          >
            {primaryAction.icon && <primaryAction.icon className="h-5 w-5" />}
            {primaryAction.label}
          </button>
        )}
        
        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors font-medium"
          >
            {secondaryAction.icon && <secondaryAction.icon className="h-5 w-5" />}
            {secondaryAction.label}
          </button>
        )}
      </div>
    </div>
  );
}

export default EmptyState;
