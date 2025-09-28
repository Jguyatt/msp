import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import LoginPage from './auth/LoginPage';
import AppShell from './AppShell';

function AppRouter() {
  const { isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AppShell />
  );
}

export default AppRouter;
