import React, { useState, useEffect } from 'react';
import {
  FileText,
  Calendar,
  Mail,
  TrendingUp,
  Clock,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  X
} from 'lucide-react';
import KPI from '../components/KPI';
import { useUserSync } from '../../hooks/useUserSync';
import { contractService } from '../../services/supabaseService';

function SummaryHeader() {
  const { clerkUser, supabaseUser, loading: userLoading } = useUserSync();
  const [kpiData, setKpiData] = useState({
    totalContracts: 0,
    expiringThisMonth: 0,
    remindersSentThisWeek: 0,
    estimatedSavings: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKPIs = async () => {
      if (userLoading || !clerkUser || !supabaseUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Get contracts for the user
        const contracts = await contractService.getContractsForUser(clerkUser.emailAddresses[0].emailAddress);
        
        // Calculate KPIs from real data
        const today = new Date();
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        const totalContracts = contracts.length;
        
        const expiringThisMonth = contracts.filter(contract => {
          const endDate = new Date(contract.end_date);
          return endDate >= today && endDate <= endOfMonth;
        }).length;
        
        // Count reminders sent this week (from contract reminders)
        const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const remindersSentThisWeek = contracts.reduce((count, contract) => {
          if (contract.reminders) {
            return count + contract.reminders.filter(reminder => 
              reminder.sent_at && new Date(reminder.sent_at) >= oneWeekAgo
            ).length;
          }
          return count;
        }, 0);
        
        // Calculate estimated savings (rough estimate)
        const estimatedSavings = expiringThisMonth * 200; // $200 per contract renewal
        
        setKpiData({
          totalContracts,
          expiringThisMonth,
          remindersSentThisWeek,
          estimatedSavings
        });
        
      } catch (error) {
        console.error('Error fetching KPIs from Supabase:', error);
        // Keep default values (0) instead of mock data
        setKpiData({
          totalContracts: 0,
          expiringThisMonth: 0,
          remindersSentThisWeek: 0,
          estimatedSavings: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchKPIs();
  }, [clerkUser, supabaseUser, userLoading]);

  const kpis = [
    {
      icon: FileText,
      label: 'Total Contracts Tracked',
      value: loading ? '...' : kpiData.totalContracts.toString(),
      sublabel: kpiData.totalContracts > 0 ? `${kpiData.totalContracts} active` : 'No contracts yet',
      positive: kpiData.totalContracts > 0
    },
    {
      icon: Calendar,
      label: 'Expiring This Month',
      value: loading ? '...' : kpiData.expiringThisMonth.toString(),
      sublabel: kpiData.expiringThisMonth > 0 ? `${kpiData.expiringThisMonth} need attention` : 'All good',
      urgent: kpiData.expiringThisMonth > 0
    },
    {
      icon: Mail,
      label: 'Reminders Sent This Week',
      value: loading ? '...' : kpiData.remindersSentThisWeek.toString(),
      sublabel: kpiData.remindersSentThisWeek > 0 ? 'Active reminders' : 'No recent activity'
    }
  ];

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Overview</h1>
              <p className="mt-2 text-gray-600">
                Monitor your contract renewals and track performance metrics
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                Development
              </span>
            </div>
          </div>
        </div>
        
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {kpis.map((kpi, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <kpi.icon className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{kpi.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                  </div>
                </div>
                {kpi.positive && !loading && (
                  <div className="flex items-center text-green-600">
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">Active</span>
                  </div>
                )}
                {kpi.urgent && !loading && (
                  <div className="flex items-center text-red-600">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">Attention</span>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500">{kpi.sublabel}</p>
                {/* Progress bar for total contracts */}
                {index === 0 && !loading && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{kpiData.totalContracts > 0 ? '100%' : '0%'}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: kpiData.totalContracts > 0 ? '100%' : '0%' }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Congratulations Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-100 rounded-full translate-y-12 -translate-x-12 opacity-50"></div>
          
          <div className="relative">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Congratulations, your contract management is working!
                </h2>
                <p className="text-gray-600 mb-4">
                  Your contract tracking and renewal management is set up with automated reminders. Next, explore additional features and configuration options.
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
                      <span className="text-blue-600 text-xs">🔐</span>
                    </div>
                    <span>Setup email notifications</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
                      <span className="text-blue-600 text-xs">📊</span>
                    </div>
                    <span>Enable analytics tracking</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
                      <span className="text-blue-600 text-xs">🏢</span>
                    </div>
                    <span>Add team collaboration</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
                      <span className="text-blue-600 text-xs">🔗</span>
                    </div>
                    <span>Configure integrations</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
                      <span className="text-blue-600 text-xs">💎</span>
                    </div>
                    <span>Go premium features</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
                      <span className="text-blue-600 text-xs">⚙️</span>
                    </div>
                    <span>And more...</span>
                  </div>
                </div>
                
                <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium">
                  Set up your first contract
                </button>
              </div>
              
              <button className="ml-4 p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-700">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-medium">System Status: All Good</span>
              </div>
              <div className="w-px h-6 bg-gray-300"></div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-5 w-5" />
                <span>Last updated: Just now</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SummaryHeader;
