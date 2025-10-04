import React from 'react';
import { Upload, Calendar, Users, Bell, FileText, BarChart3, CheckSquare } from 'lucide-react';

// Generic Empty State Component
export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  ctaText, 
  onCtaClick, 
  secondaryCtaText, 
  onSecondaryCtaClick,
  className = "" 
}) {
  return (
    <div className={`text-center py-12 px-6 ${className}`}>
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-sm mx-auto">{description}</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={onCtaClick}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          {ctaText}
        </button>
        {secondaryCtaText && onSecondaryCtaClick && (
          <button
            onClick={onSecondaryCtaClick}
            className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            {secondaryCtaText}
          </button>
        )}
      </div>
    </div>
  );
}

// Contracts Empty State
export function ContractsEmptyState({ onUpload, onAddManual }) {
  return (
    <EmptyState
      icon={FileText}
      title="No contracts yet"
      description="Upload your first contract to get started with AI-powered analysis and automated tracking."
      ctaText="Upload a sample contract"
      onCtaClick={onUpload}
      secondaryCtaText="Add manually"
      onSecondaryCtaClick={onAddManual}
    />
  );
}

// Analytics Empty State
export function AnalyticsEmptyState({ onUpload, onViewContracts }) {
  return (
    <EmptyState
      icon={BarChart3}
      title="No analytics data yet"
      description="Upload contracts to see AI-powered insights, cost optimization recommendations, and savings opportunities."
      ctaText="Upload contracts"
      onCtaClick={onUpload}
      secondaryCtaText="View contracts"
      onSecondaryCtaClick={onViewContracts}
    />
  );
}

// Todos Empty State
export function TodosEmptyState({ onUpload, onAddRenewal }) {
  return (
    <EmptyState
      icon={CheckSquare}
      title="No tasks yet"
      description="Once you upload contracts, we'll automatically generate smart tasks and reminders to keep you on track."
      ctaText="Upload contracts"
      onCtaClick={onUpload}
      secondaryCtaText="Add renewal date"
      onSecondaryCtaClick={onAddRenewal}
    />
  );
}

// Vendors Empty State
export function VendorsEmptyState({ onUpload, onInviteTeam }) {
  return (
    <EmptyState
      icon={Users}
      title="No vendor data yet"
      description="Vendor information will be automatically extracted when you upload contracts."
      ctaText="Upload contracts"
      onCtaClick={onUpload}
      secondaryCtaText="Invite teammate"
      onSecondaryCtaClick={onInviteTeam}
    />
  );
}

// Alerts Empty State
export function AlertsEmptyState({ onEnableReminders, onUpload }) {
  return (
    <EmptyState
      icon={Bell}
      title="No alerts configured"
      description="Set up reminders and alerts to never miss important contract deadlines and renewal dates."
      ctaText="Enable reminders"
      onCtaClick={onEnableReminders}
      secondaryCtaText="Upload contracts"
      onSecondaryCtaClick={onUpload}
    />
  );
}

// Dashboard Empty State (when no data at all)
export function DashboardEmptyState({ onStartTour, onUpload }) {
  return (
    <div className="text-center py-16 px-6">
      <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Upload className="h-10 w-10 text-blue-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">Welcome to Renlu</h3>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        Get started by uploading your first contract. Our AI will analyze it and help you manage renewals, track savings, and never miss important dates.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={onUpload}
          className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Upload your first contract
        </button>
        <button
          onClick={onStartTour}
          className="px-8 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
        >
          Take a tour first
        </button>
      </div>
    </div>
  );
}

// All components are already exported as named exports above
