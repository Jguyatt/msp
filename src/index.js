import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-react';
import './index.css';
import AppRouter from './app/AppRouter';
import LandingPage from './LandingPage';
// PDF.js initialization disabled - using backend API instead

// Clerk configuration for Create React App
const publishableKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY || 'pk_test_d29ya2luZy1taXRlLTYwLmNsZXJrLmFjY291bnRzLmRldiQ';

console.log('Clerk Setup for Create React App:');
console.log('- Publishable Key:', publishableKey ? 'Loaded' : 'Missing');
console.log('- Key Preview:', publishableKey.substring(0, 25) + '...');

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ClerkProvider 
      publishableKey={publishableKey}
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
    >
      <BrowserRouter>
        <SignedOut>
          <LandingPage />
        </SignedOut>
        <SignedIn>
          <AppRouter />
        </SignedIn>
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>
);
