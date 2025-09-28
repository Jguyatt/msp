import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SideNav from './layout/SideNav';
import SummaryHeader from './layout/SummaryHeader';
import ContractsPage from './contracts/ContractsPage';
import UploadPage from './contracts/UploadPage';
import SettingsPage from './settings/SettingsPage';
import TeamPage from './settings/TeamPage';
import PlansPage from './plans/PlansPage';

function AppShell() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SideNav />
      
      {/* Main content area with top margin for the top bar */}
      <div className="main-content pt-16 transition-all duration-300" style={{ marginLeft: '16rem' }}>
        <Routes>
          <Route 
            path="/app/dashboard" 
            element={
              <div className="min-h-screen bg-gray-50">
                <SummaryHeader />
                <div className="bg-white border-t border-gray-200">
                  <ContractsPage isCompact={true} />
                </div>
              </div>
            } 
          />
          <Route path="/app/contracts" element={<div className="bg-gray-50 min-h-screen"><ContractsPage /></div>} />
          <Route path="/app/upload" element={<div className="bg-gray-50 min-h-screen"><UploadPage /></div>} />
          <Route path="/app/settings" element={<div className="bg-gray-50 min-h-screen"><SettingsPage /></div>} />
          <Route path="/app/team" element={<div className="bg-gray-50 min-h-screen"><TeamPage /></div>} />
          <Route path="/app/plans" element={<PlansPage />} />
          <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default AppShell;
