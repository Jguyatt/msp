import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { ShieldCheck } from 'lucide-react';

function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="flex min-h-screen">
        {/* Left side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-700 p-12 flex-col justify-between text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold">RenewalGuard</span>
          </div>
          
          <div>
            <h1 className="text-4xl font-bold mb-6">
              Never Miss Another Renewal
            </h1>
            <p className="text-lg text-blue-100 leading-relaxed">
              Enterprise contract tracking and automated reminders built for MSPs. 
              Safeguard your margins with intelligent renewal management.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-100">80%</div>
              <div className="text-sm text-blue-200">Time Saved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-100">$2.4K</div>
              <div className="text-sm text-blue-200">Avg. Savings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-100">100%</div>
              <div className="text-sm text-blue-200">Accuracy</div>
            </div>
          </div>
        </div>

        {/* Right side - Auth */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center lg:hidden mb-8">
              <ShieldCheck className="h-12 w-12 mx-auto text-blue-600 mb-4" />
              <h2 className="text-3xl font-bold text-gray-900">RenewalGuard</h2>
            </div>
            <SignIn />
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
