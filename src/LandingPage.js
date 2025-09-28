import React from "react";
import { Helmet } from "react-helmet"; // SEO <title>/<meta>
import { useUser, SignUp, SignIn } from "@clerk/clerk-react";
import {
  ShieldCheck,
  UploadCloud,
  BellRing,
  LayoutDashboard,
  KeySquare,
  ToggleLeft,
  Send,
  CheckCircle2,
  Quote,
  PlayCircle,
  ArrowRight,
  Github,
  Twitter,
  Linkedin,
} from "lucide-react";
import RenluLogo from "./components/RenluLogo";

// Single-file, production-ready landing page for an MSP-focused
// Automated Contract Renewal Tracker. TailwindCSS assumed.
// Copy is intentionally concise, informational, and MSP-specific.

export default function LandingPage() {
  const [showAuth, setShowAuth] = React.useState(false);
  const [isSignUp, setIsSignUp] = React.useState(true);

  const handleStartFreeTrial = () => {
    setShowAuth(true);
    setIsSignUp(true);
  };

  const handleSignInClick = () => {
    setShowAuth(true);
    setIsSignUp(false);
  };

  if (showAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        {/* Branded Header */}
        <div className="flex items-center justify-between p-8">
          <RenluLogo size={40} variant="default" />
          <button
            onClick={() => setShowAuth(false)}
            className="text-slate-600 hover:text-slate-900"
          >
            ← Back to Home
          </button>
        </div>

        {/* Auth Form */}
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                {isSignUp ? 'Start Your Free Trial' : 'Welcome Back'}
              </h1>
              <p className="text-slate-600">
                {isSignUp 
                  ? 'Get started in under 60 seconds' 
                  : 'Sign in to your account'
                }
              </p>
            </div>

            {isSignUp ? <SignUp /> : <SignIn />}
            
            <div className="mt-6 text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900">
      {/* SEO: Title + Meta */}
      <Helmet>
        <title>Never Miss Another Renewal | Renlu - Contract Renewal Tracker for MSPs</title>
        <meta
          name="description"
          content="Renlu automates contract expiry tracking and 90/60/30-day reminders for MSPs. Ingest from PSA/RMM or CSV, centralize renewals, and protect your margins."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="index,follow" />
      </Helmet>

      {/* Header / Nav */}
      <header className="sticky top-0 z-30 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80 bg-white/95 border-b border-slate-200/60 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <RenluLogo size={40} variant="default" />
            <nav className="hidden md:flex items-center gap-8 text-sm">
              <a href="#features" className="font-medium text-slate-600 hover:text-slate-900 transition-colors duration-200">Features</a>
              <a href="#how" className="font-medium text-slate-600 hover:text-slate-900 transition-colors duration-200">How It Works</a>
              <a href="#benefits" className="font-medium text-slate-600 hover:text-slate-900 transition-colors duration-200">Benefits</a>
              <a href="#testimonials" className="font-medium text-slate-600 hover:text-slate-900 transition-colors duration-200">Customers</a>
            </nav>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSignInClick}
                className="hidden sm:inline-flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white/80 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:shadow-md transition-all duration-200"
              >
                <KeySquare className="h-4 w-4" /> Login
              </button>
              <button
                onClick={handleStartFreeTrial}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/25 hover:from-slate-800 hover:to-slate-700 hover:shadow-xl hover:shadow-slate-900/30 transition-all duration-200"
              >
                Start For Free <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <div className="absolute inset-0 opacity-20" style={{backgroundImage: `url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23f1f5f9" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')`}}></div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-16">
            <div className="relative">
              <div className="absolute -inset-x-6 -inset-y-6 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-3xl -z-10"></div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 leading-tight">
                Never Miss Another{" "}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Renewal
                </span>
              </h1>
              <p className="mt-6 text-xl text-slate-600 leading-relaxed max-w-2xl">
                Enterprise-grade contract expiry tracking and automated reminders that safeguard your margins. 
                Replace error-prone spreadsheets with a centralized system built exclusively for MSPs.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleStartFreeTrial}
                  className="group inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 px-8 py-4 text-lg font-bold text-white shadow-2xl shadow-slate-900/25 hover:from-slate-800 hover:to-slate-700 hover:shadow-slate-900/40 transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  Start For Free
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  onClick={handleSignInClick}
                  className="inline-flex items-center justify-center rounded-2xl border-2 border-slate-200 bg-white/90 backdrop-blur-sm px-8 py-4 text-lg font-bold text-slate-700 hover:border-slate-300 hover:bg-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <KeySquare className="mr-2 h-5 w-5" />
                  Login
                </button>
              </div>
              <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span>14-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-400"></div>
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-purple-400"></div>
                  <span>PSA/RMM integrations</span>
                </div>
              </div>
            </div>

            {/* Premium Illustration */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-xl"></div>
              <div className="relative mx-auto w-full max-w-lg rounded-3xl bg-gradient-to-br from-white to-slate-50 p-8 shadow-2xl border border-slate-200/50">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full bg-green-400"></div>
                    <div className="h-4 w-4 rounded-full bg-yellow-400"></div>
                    <div className="h-4 w-4 rounded-full bg-red-400"></div>
                    <div className="ml-auto text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                      RENEWAL TRACKER
                    </div>
                  </div>
                  
                  {/* Content Blocks */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                      <div>
                        <div className="w-16 h-2 bg-blue-200 rounded mb-2"></div>
                        <div className="w-12 h-1.5 bg-blue-300 rounded"></div>
                      </div>
                      <div className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded">30 days</div>
                    </div>
                    
                    <div className="flex items-center justify-between bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                      <div>
                        <div className="w-20 h-2 bg-orange-200 rounded mb-2"></div>
                        <div className="w-14 h-1.5 bg-orange-300 rounded"></div>
                      </div>
                      <div className="text-xs font-bold text-orange-700 bg-orange-100 px-2 py-1 rounded">60 days</div>
                    </div>
                    
                    <div className="flex items-center justify-between bg-green-50/50 p-4 rounded-xl border border-green-100">
                      <div>
                        <div className="w-12 h-2 bg-green-200 rounded mb-2"></div>
                        <div className="w-8 h-1.5 bg-green-300 rounded"></div>
                      </div>
                      <div className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded">90 days</div>
                    </div>
                    
                    <div className="flex justify-center items-center gap-4 mt-6">
                      <div className="h-6 w-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg animate-pulse"></div>
                      <span className="text-xs font-medium text-slate-600 tracking-wide">Automated Alerts</span>
                    </div>
                  </div>
                </div>
                <div className="mt-6 text-center text-xs text-slate-500 font-medium">Live Dashboard Preview</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-32 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <header className="text-center max-w-4xl mx-auto mb-20">
            <div className="inline-flex items-center rounded-full bg-blue-50 px-4 py-2 mb-6 text-sm font-semibold text-blue-700">
              <div className="w-2 h-2 rounded-full bg-blue-400 mr-2 animate-pulse"></div>
              Enterprise Features
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 leading-tight">
              Purpose‑built Features for{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                MSP Operations
              </span>
            </h2>
            <p className="mt-6 text-xl text-slate-600 leading-relaxed">
              Eliminate operational gaps and spreadsheet chaos. Standardize enterprise-grade renewal capture,
              tracking, and escalation workflows across your entire portfolio.
            </p>
          </header>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<UploadCloud className="h-7 w-7" />}
              title="Automated Ingestion"
              blurb="Seamlessly connect to ConnectWise, Kaseya, or Datto via API. Upload CSV exports and watch as we deduplicate vendors, normalize contract terms, and backfill expiration dates instantly."
              color="blue"
            />
            <FeatureCard
              icon={<BellRing className="h-7 w-7" />}
              title="Smart Reminders"
              blurb="Intelligent 90/60/30-day alert workflows emailed automatically to stakeholders. Custom escalation chains ensure nothing slips through the cracks—assign owners and silence-based routing."
              color="orange"
            />
            <FeatureCard
              icon={<LayoutDashboard className="h-7 w-7" />}
              title="Centralized Dashboard"
              blurb="Real-time executive visibility into upcoming contract expirations with granular filtering. Sort by client importance, vendor relationships, MRR impact, or assigned owner."
              color="purple"
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="py-20 sm:py-32 bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <header className="text-center max-w-4xl mx-auto mb-20">
            <div className="inline-flex items-center rounded-full bg-green-50 px-4 py-2 mb-6 text-sm font-semibold text-green-700">
              <div className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse"></div>
              Simple Implementation
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 leading-tight">
              How It Works
            </h2>
            <p className="mt-6 text-xl text-slate-600 leading-relaxed">
              Deploy value in under 60 minutes. Our workflow mirrors existing MSP operations—
              but with enterprise automation and zero operational overhead.
            </p>
          </header>
          <ol className="grid gap-8 sm:grid-cols-3">
            <StepCard
              step={1}
              icon={<KeySquare className="h-8 w-8" />}
              title="Connect or Upload"
              text="Integrate seamlessly with ConnectWise, Kaseya, or Datto APIs for instant contract ingestion. CSV bulk imports supported with intelligent vendor mapping and duplicate resolution."
              color="blue"
            />
            <StepCard
              step={2}
              icon={<ToggleLeft className="h-8 w-8" />}
              title="Configure Reminder Strategy"
              text="Customize 120/90/60/30-day alert intervals with stakeholder assignments. Design escalation chains, determine client notification logic, and set renewal priority matrices."
              color="purple"
            />
            <StepCard
              step={3}
              icon={<Send className="h-8 w-8" />}
              title="Automated Execution"
              text="Enterprise-grade email sequences execute on schedule with full audit trails. Focus your team on strategic renewals and relationship building, not administrative overhead."
              color="green"
            />
          </ol>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="py-20 sm:py-32 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <header className="text-center max-w-4xl mx-auto mb-20">
            <div className="inline-flex items-center rounded-full bg-green-50 px-4 py-2 mb-6 text-sm font-semibold text-green-700">
              <div className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse"></div>
              Measurable Results
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 leading-tight">
              Operational Wins You Can{" "}
              <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Measure
              </span>
            </h2>
            <p className="mt-6 text-xl text-slate-600 leading-relaxed">
              Quantified productivity gains that protect margins, eliminate churn risk, and enable team scalability—all without operational overhead.
            </p>
          </header>
          <div className="grid gap-6 sm:grid-cols-2">
            <BenefitItem 
              text="Save 80% of manual contract tracking time—more strategic focus on revenue growth."
              metric="80%"
              description="Time Saved"
            />
            <BenefitItem 
              text="Eliminate costly auto-renewals and uncaptured vendor cost creep."
              metric="$50K+"
              description="Annual Savings"
            />
            <BenefitItem 
              text="Scale team operations efficiently without requiring additional headcount."
              metric="3x"
              description="Productivity"
            />
            <BenefitItem 
              text="Standardize renewal workflows across all account managers and teams."
              metric="100%"
              description="Consistency"
            />
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section id="testimonials" className="py-20 sm:py-32 bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <header className="text-center max-w-4xl mx-auto mb-20">
            <div className="inline-flex items-center rounded-full bg-blue-500/20 px-4 py-2 mb-6 text-sm font-semibold text-blue-300">
              <div className="w-2 h-2 rounded-full bg-blue-400 mr-2 animate-pulse"></div>
              Enterprise Trust
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight">
              Trusted by Leading{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                MSPs
              </span>
            </h2>
            <p className="mt-6 text-xl text-slate-300 leading-relaxed">
              Executive teams leverage Renlu to eliminate contract management friction, 
              optimize vendor relationships, and maximize recurring revenue opportunities.
            </p>
          </header>
          <div className="grid gap-8 md:grid-cols-3">
            <TestimonialCard
              quote="We eliminated three spreadsheet toils and surprise auto-renewals forever. ROI achieved in the first billing cycle—and our COO finally sleeps well."
              name="Alicia Martinez"
              title="Operations Manager"
              company="TechFlow Solutions"
              size="28-person MSP"
            />
            <TestimonialCard
              quote="Account managers now have clear visibility into every upcoming renewal with automated escalation workflows. Zero critical renewals missed since implementation."
              name="Ravi Krishnan"
              title="Account Director"
              company="MultiPrime Networks"
              size="Multi-site Operations"
            />
            <TestimonialCard
              quote="Deployed in under 4 hours via ConnectWise integration. Renewal predictability transformed, margins increased 15%, and team productivity doubled."
              name="Caroline Thompson"
              title="Chief Operating Officer"
              company="SecureForce MSP"
              size="Security-focused MSP"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-slate-900 to-slate-800 border-t border-slate-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 mb-12">
            <RenluLogo size={40} variant="white" />
            <nav className="flex flex-wrap items-center gap-8 text-sm text-slate-300">
              <a href="#features" className="font-medium hover:text-white transition-colors duration-200">Features</a>
              <a href="#how" className="font-medium hover:text-white transition-colors duration-200">How It Works</a>
              <a href="#benefits" className="font-medium hover:text-white transition-colors duration-200">Benefits</a>
              <a href="#testimonials" className="font-medium hover:text-white transition-colors duration-200">Testimonials</a>
              <a href="#pricing" className="font-medium hover:text-white transition-colors duration-200">Pricing</a>
              <a href="#contact" className="font-medium hover:text-white transition-colors duration-200">Contact</a>
            </nav>
            <div className="flex items-center gap-6 text-slate-400">
              <a href="#" aria-label="Twitter" className="hover:text-white transition-colors duration-200">
                <Twitter className="h-6 w-6" />
              </a>
              <a href="#" aria-label="LinkedIn" className="hover:text-white transition-colors duration-200">
                <Linkedin className="h-6 w-6" />
              </a>
              <a href="#" aria-label="GitHub" className="hover:text-white transition-colors duration-200">
                <Github className="h-6 w-6" />
              </a>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <p className="text-sm text-slate-400">
              © {new Date().getFullYear()} Renlu, Inc. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <a href="#" className="hover:text-white transition-colors duration-200">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors duration-200">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors duration-200">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ==========================
 * Reusable Subcomponents
 * ==========================
 */

function FeatureCard({ icon, title, blurb, color = "blue" }) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    orange: "bg-orange-50 text-orange-600 border-orange-200", 
    purple: "bg-purple-50 text-purple-600 border-purple-200"
  };
  
  return (
    <div className="group relative rounded-3xl border border-slate-200 bg-white p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-transparent to-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative">
        <div className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl border-2 ${colorClasses[color]} mb-6 transition-all duration-300 group-hover:scale-110`}>
          {icon}
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-4 leading-tight">{title}</h3>
        <p className="text-slate-600 leading-relaxed text-base">{blurb}</p>
      </div>
    </div>
  );
}

function StepCard({ step, icon, title, text, color = "blue" }) {
  const colorClasses = {
    blue: "bg-blue-500 text-white",
    purple: "bg-purple-500 text-white", 
    green: "bg-green-500 text-white"
  };
  
  return (
    <li className="group relative">
      <div className="absolute -inset-4 bg-gradient-to-r from-slate-900/5 to-blue-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative rounded-3xl border border-slate-200 bg-white p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform group-hover:-translate-y-1">
        <div className={`absolute -top-4 left-8 flex h-12 w-12 items-center justify-center rounded-full ${colorClasses[color]} text-lg font-bold shadow-lg`}>
          {step}
        </div>
        <div className="mt-4 flex items-start gap-6">
          <div className={`flex h-16 w-16 items-center justify-center rounded-2xl border-2 ${
            color === "blue" ? "bg-blue-50 text-blue-600 border-blue-200" :
            color === "purple" ? "bg-purple-50 text-purple-600 border-purple-200" :
            "bg-green-50 text-green-600 border-green-200"
          } transition-all duration-300 group-hover:scale-110`}>
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-2xl font-bold text-slate-900 mb-3">{title}</h3>
            <p className="text-base text-slate-600 leading-relaxed">{text}</p>
          </div>
        </div>
      </div>
    </li>
  );
}

function BenefitItem({ text, metric, description }) {
  return (
    <li className="group relative rounded-3xl bg-white p-8 shadow-lg border border-slate-200 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-start gap-6">
        <div className="flex-shrink-0">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {metric}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            {description}
          </div>
          <div className="text-lg text-slate-700 font-medium leading-relaxed">
            {text}
          </div>
        </div>
        <CheckCircle2 className="mt-2 h-6 w-6 text-green-500 flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
      </div>
    </li>
  );
}

function TestimonialCard({ quote, name, title, company, size }) {
  return (
    <figure className="group relative rounded-3xl bg-gradient-to-br from-slate-800 to-slate-700 p-8 shadow-2xl border border-slate-600 hover:shadow-3xl hover:from-slate-700 hover:to-slate-600 transition-all duration-300 transform hover:-translate-y-1">
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative">
        <Quote className="h-8 w-8 text-blue-400 mb-6" />
        <blockquote className="text-lg text-slate-200 leading-relaxed mb-8 font-medium">
          "{quote}"
        </blockquote>
        <figcaption className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
            {name.charAt(0)}
          </div>
          <div>
            <div className="text-white font-bold text-lg">{name}</div>
            <div className="text-slate-300 text-sm">{title}</div>
            <div className="text-blue-400 text-sm font-semibold">{company}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">{size}</div>
          </div>
        </figcaption>
      </div>
    </figure>
  );
}

/* ==========================
 * Implementation Notes
 * ----------------------
 * - TailwindCSS should be configured in your project (see Cursor prompt below).
 * - Icons from `lucide-react` are used for clarity and speed.
 * - Replace the SVG placeholder with product screenshots when available.
 * - Wire the CTAs (#signup, #demo) to your auth/modal or routing.
 * - Add Pricing/FAQ/Contact sections or routes as needed.
 */
