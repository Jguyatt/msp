import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-react';
import './index.css';
import AppRouter from './app/AppRouter';
import LandingPage from './LandingPage';

// Make sure this matches your Clerk publishable key
const publishableKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error("Missing publishable key");
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ClerkProvider publishableKey={publishableKey}>
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
