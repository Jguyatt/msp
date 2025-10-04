import React, { useState, useEffect } from 'react';
import { FileText, Download, Copy, Check, AlertCircle, Loader2, Target, Clock, DollarSign, Users, Settings } from 'lucide-react';
import { generateRFPTemplate, analyzeContractForRFP } from '../../services/rfpTemplateService';
import { contractService } from '../../services/supabaseService';

function RFPTemplate({ contract, pricingData = null, clauseData = null }) {
  const [rfpTemplate, setRfpTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedSection, setCopiedSection] = useState(null);
  const [expandedSections, setExpandedSections] = useState(new Set(['executive_summary']));
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    if (contract) {
      generateTemplate();
    }
  }, [contract]);

  const generateTemplate = async (forceRegenerate = false) => {
    if (!contract || !contract.id) return;

    setLoading(true);
    setError(null);

    try {
      // Analyze contract data
      const contractAnalysis = analyzeContractForRFP(contract);
      
      // Generate RFP template (with caching)
      const result = await generateRFPTemplate(
        contract.id,
        contractAnalysis,
        pricingData,
        clauseData,
        forceRegenerate
      );

      if (result.success) {
        setRfpTemplate(result.template);
        setFromCache(result.fromCache || false);
        // Show cache status to user
        if (result.fromCache) {
          console.log('Loaded RFP template from cache');
        } else {
          console.log('Generated new RFP template');
        }
      } else {
        setError(result.error);
        setRfpTemplate(result.template); // Use fallback template
      }
    } catch (err) {
      console.error('Error generating RFP template:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text, sectionId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(sectionId);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const toggleSection = (sectionId) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const downloadTemplate = () => {
    if (!rfpTemplate) return;

    const content = generateDocumentContent();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RFP_${contract.contractName || 'Template'}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateDocumentContent = () => {
    if (!rfpTemplate) return '';

    let content = `${rfpTemplate.title}\n`;
    content += `${'='.repeat(rfpTemplate.title.length)}\n\n`;
    content += `${rfpTemplate.summary}\n\n`;

    rfpTemplate.sections.forEach((section, index) => {
      content += `${index + 1}. ${section.title}\n`;
      content += `${'-'.repeat(section.title.length + 3)}\n`;
      content += `${section.content}\n\n`;
      
      if (section.placeholders && section.placeholders.length > 0) {
        content += `Placeholders to customize:\n`;
        section.placeholders.forEach(placeholder => {
          content += `- [${placeholder}]\n`;
        });
        content += '\n';
      }
    });

    if (rfpTemplate.benchmarkTargets) {
      content += `BENCHMARK TARGETS\n`;
      content += `${'-'.repeat(20)}\n`;
      Object.entries(rfpTemplate.benchmarkTargets).forEach(([key, value]) => {
        content += `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}\n`;
      });
      content += '\n';
    }

    if (rfpTemplate.evaluationCriteria) {
      content += `EVALUATION CRITERIA\n`;
      content += `${'-'.repeat(20)}\n`;
      rfpTemplate.evaluationCriteria.forEach(criteria => {
        content += `${criteria.category} (${criteria.weight}%):\n`;
        criteria.criteria.forEach(item => {
          content += `- ${item}\n`;
        });
        content += '\n';
      });
    }

    return content;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Generating RFP Template</h3>
          <p className="text-sm text-slate-600">AI is analyzing your contract data and creating a custom RFP...</p>
        </div>
      </div>
    );
  }

  if (error && !rfpTemplate) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-lg">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold">Failed to Generate RFP Template</h4>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={() => generateTemplate(false)}
              className="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!rfpTemplate) {
    return (
      <div className="bg-blue-50 border border-blue-200 text-blue-800 p-6 rounded-lg">
        <div className="flex items-start space-x-3">
          <FileText className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold">RFP Template Ready</h4>
            <p className="text-sm mt-1">Click "Generate Template" to create a custom RFP based on your contract data.</p>
            <button
              onClick={() => generateTemplate(false)}
              className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
            >
              Generate Template
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* What is an RFP Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">What is an RFP?</h4>
            <p className="text-sm text-blue-800 leading-relaxed">
              <strong>RFP (Request for Proposal)</strong> is a formal business document used to solicit competitive bids from potential vendors or service providers. 
              It outlines your project requirements, timeline, budget, and evaluation criteria to help you find the best vendor for your needs. 
              Think of it as a "help wanted" ad for business services - it tells vendors exactly what you need so they can submit detailed proposals.
            </p>
            <div className="mt-3 text-xs text-blue-700">
              <strong>Why use an RFP?</strong> It ensures fair competition, helps you compare vendors objectively, 
              and gives you leverage to negotiate better terms and pricing.
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-900">{rfpTemplate.title}</h3>
            {fromCache && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                Cached
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 mt-1">{rfpTemplate.summary}</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
          <button
            onClick={() => generateTemplate(true)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-600 text-white text-sm rounded-md hover:bg-slate-700 transition-colors"
          >
            <FileText className="h-4 w-4" />
            Regenerate
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold">Using Fallback Template</h4>
              <p className="text-sm">AI generation failed, but we've provided a standard template. {error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Benchmark Targets */}
      {rfpTemplate.benchmarkTargets && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Benchmark Targets
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(rfpTemplate.benchmarkTargets).map(([key, value]) => (
              <div key={key} className="bg-white p-3 rounded border">
                <div className="text-sm font-medium text-green-700 capitalize">
                  {key.replace(/([A-Z])/g, ' $1')}
                </div>
                <div className="text-sm text-green-900 mt-1">{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RFP Sections */}
      <div className="space-y-4">
        <h4 className="font-semibold text-slate-900 flex items-center gap-2">
          <FileText className="h-4 w-4" />
          RFP Sections
        </h4>
        
        {rfpTemplate.sections.map((section, index) => (
          <div key={section.id} className="bg-white border border-slate-200 rounded-lg">
            <div className="px-4 py-3 flex items-center justify-between">
              <button
                onClick={() => toggleSection(section.id)}
                className="flex items-center gap-3 text-left hover:bg-slate-50 p-2 -m-2 rounded transition-colors flex-1"
              >
                <span className="text-sm font-medium text-slate-500">#{index + 1}</span>
                <h5 className="font-semibold text-slate-900">{section.title}</h5>
                {section.placeholders && section.placeholders.length > 0 && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {section.placeholders.length} placeholders
                  </span>
                )}
                <div className={`transform transition-transform ml-auto ${expandedSections.has(section.id) ? 'rotate-180' : ''}`}>
                  <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              <button
                onClick={() => copyToClipboard(section.content, section.id)}
                className="p-1 hover:bg-slate-200 rounded transition-colors ml-2"
                title="Copy section"
              >
                {copiedSection === section.id ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4 text-slate-500" />
                )}
              </button>
            </div>
            
            {expandedSections.has(section.id) && (
              <div className="px-4 pb-4 border-t border-slate-100">
                <div className="pt-4">
                  <div className="prose prose-sm max-w-none">
                    <p className="text-slate-700 whitespace-pre-wrap">{section.content}</p>
                  </div>
                  
                  {section.placeholders && section.placeholders.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded border">
                      <h6 className="text-sm font-semibold text-blue-900 mb-2">Customization Placeholders:</h6>
                      <div className="flex flex-wrap gap-2">
                        {section.placeholders.map((placeholder, idx) => (
                          <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            [{placeholder}]
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Evaluation Criteria */}
      {rfpTemplate.evaluationCriteria && (
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
          <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Evaluation Criteria
          </h4>
          <div className="space-y-3">
            {rfpTemplate.evaluationCriteria.map((criteria, index) => (
              <div key={index} className="bg-white p-3 rounded border">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-slate-900">{criteria.category}</h5>
                  <span className="text-sm font-semibold text-blue-600">{criteria.weight}%</span>
                </div>
                <ul className="text-sm text-slate-600 space-y-1">
                  {criteria.criteria.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-xs text-slate-500 text-center pt-4 border-t border-slate-200">
        Generated on {new Date(rfpTemplate.generatedAt || Date.now()).toLocaleString()}
        {error && ' (Using fallback template due to generation error)'}
      </div>
    </div>
  );
}

export default RFPTemplate;
