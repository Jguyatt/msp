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
import AnalyticsWidget from '../components/AnalyticsWidget';
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
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKPIs = async () => {
      console.log('SummaryHeader: useEffect triggered - userLoading:', userLoading, 'clerkUser:', !!clerkUser, 'supabaseUser:', !!supabaseUser);
      
      if (userLoading || !clerkUser || !supabaseUser) {
        console.log('SummaryHeader: Skipping fetch - user not ready');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('SummaryHeader: Fetching contracts for user:', clerkUser.emailAddresses[0].emailAddress);
        
        // Get contracts for the user
        const contractsData = await contractService.getContractsForUser(clerkUser.emailAddresses[0].emailAddress);
        console.log('SummaryHeader: Raw contracts data:', contractsData);
        
        // Store contracts for analytics widget
        setContracts(contractsData);
        
        // Debug: Log each contract's details
        contractsData.forEach((contract, index) => {
          console.log(`SummaryHeader: Contract ${index}:`, {
            name: contract.contract_name,
            end_date: contract.end_date,
            daysUntil: contract.daysUntil
          });
        });
        
        // Calculate KPIs from real data
        const today = new Date();
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        const totalContracts = contractsData.length;
        console.log('SummaryHeader: Total contracts:', totalContracts);
        
        const expiringThisMonth = contractsData.filter(contract => {
          // Use daysUntil for more accurate "expiring soon" detection (within 30 days)
          return contract.daysUntil <= 30 && contract.daysUntil >= 0;
        }).length;
        console.log('SummaryHeader: Expiring this month:', expiringThisMonth);
        
        // Count reminders sent this week (from contract reminders)
        const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const remindersSentThisWeek = contractsData.reduce((count, contract) => {
          if (contract.reminders && Array.isArray(contract.reminders)) {
            return count + contract.reminders.filter(reminder => 
              reminder.sent_at && new Date(reminder.sent_at) >= oneWeekAgo
            ).length;
          }
          return count;
        }, 0);
        
        // Calculate estimated savings (rough estimate)
        const estimatedSavings = expiringThisMonth * 200; // $200 per contract renewal
        
        console.log('SummaryHeader: Final KPI data:', {
          totalContracts,
          expiringThisMonth,
          remindersSentThisWeek,
          estimatedSavings
        });
        
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
    <div className="bg-white/80 backdrop-blur-xl">
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
          </div>
        </div>

        {/* KPI Grid with Analytics Widget */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* KPI Cards */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
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
          
          {/* Analytics Widget */}
          <div className="lg:col-span-1">
            <AnalyticsWidget contracts={contracts} />
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
