import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SideNav from './layout/SideNav';
import SummaryHeader from './layout/SummaryHeader';
import ContractsPage from './contracts/ContractsPage';
import SettingsPage from './settings/SettingsPage';
import TeamPage from './settings/TeamPage';
import PlansPage from './plans/PlansPage';
import AnalyticsPage from './analytics/AnalyticsPage';
import TodosPage from './todos/TodosPage';
import AcceptInvitationPage from './auth/AcceptInvitationPage';

function AppShell() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
        <SideNav />
        
        {/* Main content area with top margin for the top bar */}
        <div className="main-content pt-16 transition-all duration-300" style={{ marginLeft: '16rem' }}>
          <Routes>
          {/* Dashboard route for Clerk redirects */}
          <Route 
            path="/dashboard" 
            element={
              <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
                <SummaryHeader />
                <div className="bg-white/70 backdrop-blur-xl border-t border-white/30">
                  <ContractsPage isCompact={true} />
                </div>
              </div>
            } 
          />
          <Route 
            path="/app/dashboard" 
            element={
              <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
                <SummaryHeader />
                <div className="bg-white/70 backdrop-blur-xl border-t border-white/30">
                  <ContractsPage isCompact={true} />
                </div>
              </div>
            } 
          />
          <Route path="/app/contracts" element={<div className="bg-gradient-to-br from-slate-50 via-white to-blue-50/20 min-h-screen"><ContractsPage /></div>} />
          <Route path="/app/analytics" element={<AnalyticsPage />} />
          <Route path="/app/todos" element={<TodosPage />} />
          <Route path="/app/settings" element={<div className="bg-gradient-to-br from-slate-50 via-white to-blue-50/20 min-h-screen"><SettingsPage /></div>} />
          <Route path="/app/team" element={<div className="bg-gradient-to-br from-slate-50 via-white to-blue-50/20 min-h-screen"><TeamPage /></div>} />
          <Route path="/app/plans" element={<PlansPage />} />
          <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
  );
}

export default AppShell;
