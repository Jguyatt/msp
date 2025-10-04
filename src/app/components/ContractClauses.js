import React, { useState } from 'react';
import { 
  FileText, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  Shield, 
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  Brain
} from 'lucide-react';

/**
 * Component to display extracted contract clauses
 */
function ContractClauses({ clauses, loading = false, error = null, onReAnalyze = null, reAnalyzing = false }) {
  const [expandedSections, setExpandedSections] = useState({
    renewal: true,
    termination: true,
    pricing: true,
    penalties: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const getRiskLevel = (clause) => {
    if (clause.confidence >= 0.9) return 'high';
    if (clause.confidence >= 0.7) return 'medium';
    return 'low';
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const ClauseCard = ({ clause, icon: Icon, type }) => {
    const riskLevel = getRiskLevel(clause);
    const riskColor = getRiskColor(riskLevel);
    
    return (
      <div className={`p-3 rounded-lg border ${riskColor} mb-3 max-w-full overflow-hidden`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <div className="p-1.5 bg-white rounded-lg shadow-sm flex-shrink-0">
              <Icon className="h-3 w-3 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h4 className="font-semibold text-gray-900 capitalize text-sm truncate">
                  {clause.type?.replace('-', ' ') || type}
                </h4>
                <span className={`px-2 py-1 text-xs rounded-full ${riskColor} flex-shrink-0`}>
                  {Math.round(clause.confidence * 100)}%
                </span>
              </div>
              <p className="text-xs text-gray-700 mb-2 break-words">{clause.description}</p>
              
              <div className="space-y-1 text-xs">
                {clause.noticePeriod && (
                  <div className="flex items-center gap-1 flex-wrap">
                    <Clock className="h-3 w-3 text-gray-500 flex-shrink-0" />
                    <span className="font-medium">Notice:</span>
                    <span className="break-words">{clause.noticePeriod}</span>
                  </div>
                )}
                
                {clause.escalationRate && (
                  <div className="flex items-center gap-1 flex-wrap">
                    <DollarSign className="h-3 w-3 text-gray-500 flex-shrink-0" />
                    <span className="font-medium">Escalation:</span>
                    <span className="break-words">{clause.escalationRate}</span>
                  </div>
                )}
                
                {clause.penaltyRate && (
                  <div className="flex items-center gap-1 flex-wrap">
                    <AlertTriangle className="h-3 w-3 text-gray-500 flex-shrink-0" />
                    <span className="font-medium">Penalty:</span>
                    <span className="break-words">{clause.penaltyRate}</span>
                  </div>
                )}
                
                {clause.conditions && (
                  <div className="flex items-center gap-1 flex-wrap">
                    <Shield className="h-3 w-3 text-gray-500 flex-shrink-0" />
                    <span className="font-medium">Conditions:</span>
                    <span className="break-words">{clause.conditions}</span>
                  </div>
                )}
              </div>
              
              {clause.penalties && clause.penalties !== 'None specified' && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                  <span className="font-medium text-red-800">Penalties:</span>
                  <span className="text-red-700 ml-1 break-words">{clause.penalties}</span>
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={() => copyToClipboard(clause.description)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            title="Copy clause text"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  const ClauseSection = ({ title, clauses, icon: Icon, sectionKey, type }) => {
    if (!clauses || clauses.length === 0) return null;
    
    const isExpanded = expandedSections[sectionKey];
    
    return (
      <div className="mb-4">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="flex items-center gap-2 w-full text-left p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-600 flex-shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-600 flex-shrink-0" />
          )}
          <Icon className="h-4 w-4 text-gray-600 flex-shrink-0" />
          <h3 className="font-semibold text-gray-900 text-sm truncate flex-1">{title}</h3>
          <span className="ml-auto px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full flex-shrink-0">
            {clauses.length}
          </span>
        </button>
        
        {isExpanded && (
          <div className="mt-2">
            {clauses.map((clause, index) => (
              <ClauseCard 
                key={index} 
                clause={clause} 
                icon={Icon} 
                type={type}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 max-w-full overflow-hidden">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <h2 className="text-lg font-semibold text-gray-900 truncate">Contract Clauses</h2>
        </div>
        
        <div className="space-y-3">
          <div className="animate-pulse">
            <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
            <div className="h-2 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="animate-pulse">
            <div className="h-3 bg-gray-200 rounded w-2/3 mb-1"></div>
            <div className="h-2 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="truncate">Analyzing contract clauses...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-4 max-w-full overflow-hidden">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <h2 className="text-lg font-semibold text-gray-900 truncate">Contract Clauses</h2>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800 font-medium mb-2 text-sm">Analysis Failed</p>
          <p className="text-red-700 text-xs break-words mb-3">{error}</p>
          
          {onReAnalyze && (
            <button
              onClick={onReAnalyze}
              disabled={reAnalyzing}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs px-3 py-2 rounded-md transition-colors duration-200 flex items-center gap-2"
            >
              <Brain className="h-3 w-3" />
              {reAnalyzing ? 'Re-analyzing...' : 'Re-analyze Contract'}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!clauses) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 max-w-full overflow-hidden">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <h2 className="text-lg font-semibold text-gray-900 truncate">Contract Clauses</h2>
        </div>
        
        <div className="text-center py-6">
          <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No clause analysis available</p>
          <p className="text-xs text-gray-400">Upload a contract PDF to analyze its clauses</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 max-w-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <h2 className="text-lg font-semibold text-gray-900 truncate">Contract Clauses</h2>
          </div>
          
          {clauses.summary && (
            <div className="flex items-center gap-2 text-sm text-gray-600 flex-shrink-0 ml-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="whitespace-nowrap">{clauses.summary.totalClauses} clauses</span>
            </div>
          )}
        </div>
        
        {clauses.metadata && (
          <div className="mt-2 text-sm text-gray-500">
            <span>Analyzed on {new Date(clauses.metadata.extractedAt).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 max-w-full overflow-hidden">
        {/* Summary */}
        {clauses.summary && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg max-w-full overflow-hidden">
            <h3 className="font-semibold text-blue-900 mb-2 text-sm">Analysis Summary</h3>
            <div className="space-y-2 text-xs">
              <div className="flex flex-wrap gap-4">
                <div>
                  <span className="font-medium text-blue-800">Total Clauses:</span>
                  <span className="ml-1 text-blue-700">{clauses.summary.totalClauses}</span>
                </div>
                {clauses.summary.highRiskClauses && clauses.summary.highRiskClauses.length > 0 && (
                  <div>
                    <span className="font-medium text-blue-800">High Risk:</span>
                    <span className="ml-1 text-blue-700">{clauses.summary.highRiskClauses.join(', ')}</span>
                  </div>
                )}
              </div>
              
              {clauses.summary.recommendations && clauses.summary.recommendations.length > 0 && (
                <div className="mt-2">
                  <span className="font-medium text-blue-800">Recommendations:</span>
                  <ul className="mt-1 list-disc list-inside text-blue-700 space-y-1">
                    {clauses.summary.recommendations.map((rec, index) => (
                      <li key={index} className="break-words">{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Clause Sections */}
        <ClauseSection
          title="Renewal Clauses"
          clauses={clauses.renewalClauses}
          icon={Clock}
          sectionKey="renewal"
          type="renewal"
        />

        <ClauseSection
          title="Termination Clauses"
          clauses={clauses.terminationClauses}
          icon={AlertTriangle}
          sectionKey="termination"
          type="termination"
        />

        <ClauseSection
          title="Pricing Clauses"
          clauses={clauses.pricingClauses}
          icon={DollarSign}
          sectionKey="pricing"
          type="pricing"
        />

        <ClauseSection
          title="Penalty Clauses"
          clauses={clauses.penaltyClauses}
          icon={Shield}
          sectionKey="penalties"
          type="penalty"
        />
      </div>
    </div>
  );
}

export default ContractClauses;
