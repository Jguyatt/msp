/**
 * Pricing Analysis Component
 * Displays contract pricing analysis and benchmark comparisons
 */

import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, DollarSign, Target, Info, Brain } from 'lucide-react';

const PricingCard = ({ title, value, subtitle, icon: Icon, trend, trendValue, className = '' }) => (
  <div className={`bg-white rounded-lg border border-slate-200 p-4 ${className}`}>
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-slate-600" />
        <h3 className="text-sm font-medium text-slate-900">{title}</h3>
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs ${
          trend === 'up' ? 'text-red-600' : 'text-green-600'
        }`}>
          {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          <span>{trendValue}%</span>
        </div>
      )}
    </div>
    <div className="text-2xl font-bold text-slate-900">{value}</div>
    {subtitle && <div className="text-sm text-slate-600 mt-1">{subtitle}</div>}
  </div>
);

const PricingDetailsList = ({ pricingDetails }) => (
  <div className="space-y-3">
    {pricingDetails.map((detail, index) => (
      <div key={index} className="bg-slate-50 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-900 capitalize">
            {detail.type.replace('_', ' ')}
          </span>
          <span className="text-sm font-bold text-slate-900">
            ${detail.amount.toFixed(2)}
          </span>
        </div>
        <div className="text-xs text-slate-600">
          {detail.unit} • {detail.currency}
        </div>
        {detail.description && (
          <div className="text-xs text-slate-500 mt-1">{detail.description}</div>
        )}
        {detail.effectiveDate && (
          <div className="text-xs text-slate-500">
            Effective: {new Date(detail.effectiveDate).toLocaleDateString()}
          </div>
        )}
      </div>
    ))}
  </div>
);

export default function PricingAnalysis({ pricingData, loading, error, onReAnalyze = null, reAnalyzing = false }) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="h-5 w-5 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-900">Pricing Analysis</h2>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          <div className="h-4 bg-slate-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <h2 className="text-lg font-semibold text-red-900">Pricing Analysis Error</h2>
        </div>
        <div className="text-sm text-red-700 mb-3">{error}</div>
        
        {onReAnalyze && (
          <button
            onClick={onReAnalyze}
            disabled={reAnalyzing}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2"
          >
            <Brain className="h-4 w-4" />
            {reAnalyzing ? 'Re-analyzing...' : 'Re-analyze Contract'}
          </button>
        )}
      </div>
    );
  }

  if (!pricingData || !pricingData.benchmarkComparison) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="h-5 w-5 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-900">Pricing Analysis</h2>
        </div>
        <div className="text-sm text-slate-600">No pricing data available</div>
      </div>
    );
  }

  const { benchmarkComparison, pricingDetails, totalAnnualCost, pricingModel, summary } = pricingData;
  const { available, productInfo, vendorRate, benchmarkRate, variance, significantVariance, recommendation } = benchmarkComparison;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <DollarSign className="h-5 w-5 text-slate-600" />
        <h2 className="text-lg font-semibold text-slate-900">Pricing Analysis</h2>
        {available && (
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            significantVariance 
              ? 'bg-red-100 text-red-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {significantVariance ? 'Variance Detected' : 'Within Standards'}
          </div>
        )}
      </div>

      {available ? (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PricingCard
              title="Vendor Rate"
              value={`$${vendorRate.toFixed(2)}`}
              subtitle={`${productInfo.vendor} pricing`}
              icon={Target}
              trend={variance > 0 ? 'up' : 'down'}
              trendValue={Math.abs(variance).toFixed(1)}
              className={variance > 10 ? 'border-red-200 bg-red-50' : variance < -10 ? 'border-green-200 bg-green-50' : ''}
            />
            <PricingCard
              title="Industry Average"
              value={`$${benchmarkRate.toFixed(2)}`}
              subtitle={`${benchmarkComparison.benchmark.unit}`}
              icon={Target}
            />
            <PricingCard
              title="Annual Cost"
              value={`$${totalAnnualCost.toFixed(2)}`}
              subtitle={`${pricingModel} pricing`}
              icon={DollarSign}
            />
          </div>

          {/* Variance Alert */}
          {significantVariance && (
            <div className={`p-4 rounded-lg border ${
              variance > 0 ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
            }`}>
              <div className="flex items-start gap-3">
                {variance > 0 ? (
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                )}
                <div>
                  <h3 className={`font-medium ${
                    variance > 0 ? 'text-red-900' : 'text-green-900'
                  }`}>
                    {variance > 0 ? 'Above Market Rate' : 'Below Market Rate'}
                  </h3>
                  <p className={`text-sm mt-1 ${
                    variance > 0 ? 'text-red-700' : 'text-green-700'
                  }`}>
                    {recommendation}
                  </p>
                  <div className={`text-xs mt-2 ${
                    variance > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {variance > 0 ? 'Overpaying' : 'Saving'} ${Math.abs(benchmarkComparison.annualImpact).toFixed(2)} annually
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pricing Details */}
          {pricingDetails && pricingDetails.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-900 mb-3">Pricing Breakdown</h3>
              <PricingDetailsList pricingDetails={pricingDetails} />
            </div>
          )}

          {/* Summary */}
          {summary && (
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-slate-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-slate-900 mb-1">Analysis Summary</h4>
                  <p className="text-sm text-slate-600">{summary}</p>
                </div>
              </div>
            </div>
          )}

          {/* Benchmark Info */}
          <div className="text-xs text-slate-500 border-t pt-4">
            Benchmark data last updated: {new Date(benchmarkComparison.benchmark.lastUpdated).toLocaleDateString()}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-yellow-900">Benchmark Data Unavailable</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  {benchmarkComparison.message}
                </p>
                {benchmarkComparison.productInfo && (
                  <div className="text-xs text-yellow-600 mt-2">
                    <strong>Detected:</strong> {benchmarkComparison.productInfo.vendor} - {benchmarkComparison.productInfo.product}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Fallback: Show pricing details if available */}
          {pricingDetails && pricingDetails.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-900 mb-3">Contract Pricing</h3>
              <PricingDetailsList pricingDetails={pricingDetails} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
