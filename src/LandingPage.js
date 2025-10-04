import React, { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet";
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
  Brain,
  DollarSign,
  ClipboardList,
  MessageCircle,
  FileText,
  Zap,
  TrendingUp,
  Target,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import RenluLogo from "./components/RenluLogo";

export default function LandingPage() {
  const [showAuth, setShowAuth] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const heroRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
      
      // Calculate scroll progress for fold animation
      const heroHeight = heroRef.current?.offsetHeight || 0;
      const progress = Math.min(scrollTop / (heroHeight * 0.8), 1);
      setScrollProgress(progress);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleStartFreeTrial = () => {
    setShowAuth(true);
    setIsSignUp(true);
  };

  const handleSignInClick = () => {
    setShowAuth(true);
    setIsSignUp(false);
  };

  const scrollToContent = () => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (showAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <div className="flex items-center justify-between p-8">
          <RenluLogo size={40} variant="default" />
          <button
            onClick={() => setShowAuth(false)}
            className="text-slate-600 hover:text-slate-900"
          >
            ← Back to Home
          </button>
        </div>
        <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
          <div className="w-full max-w-md mx-auto px-4">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900 overflow-x-hidden">
      <Helmet>
        <title>Never Miss Another Renewal | Renlu - Contract Renewal Tracker for MSPs & SMBs</title>
        <meta
          name="description"
          content="Renlu automates contract expiry tracking and 90/60/30-day reminders for MSPs and SMBs. Ingest from PSA/RMM or CSV, centralize renewals, and protect your margins."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="index,follow" />
      </Helmet>

      {/* Fixed Header */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        isScrolled 
          ? 'backdrop-blur-xl bg-white/90 shadow-lg border-b border-slate-200/60' 
          : 'backdrop-blur-none bg-transparent'
      }`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <RenluLogo size={40} variant="default" />
            <nav className="hidden md:flex items-center gap-8 text-sm">
              <a href="#features" className="font-medium text-slate-600 hover:text-slate-900 transition-colors duration-200">Features</a>
              <a href="#how" className="font-medium text-slate-600 hover:text-slate-900 transition-colors duration-200">How It Works</a>
              <a href="#benefits" className="font-medium text-slate-600 hover:text-slate-900 transition-colors duration-200">Benefits</a>
              <a href="#pricing" className="font-medium text-slate-600 hover:text-slate-900 transition-colors duration-200">Pricing</a>
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

      {/* Single Continuous Flow - No Sections */}
      <div className="relative">
        {/* Hero Section with Fold Animation */}
        <div 
          ref={heroRef}
          className="relative min-h-screen flex items-center justify-center overflow-hidden"
          style={{
            transform: `translateY(${scrollProgress * -50}px)`,
            opacity: 1 - scrollProgress * 0.3
          }}
        >
          {/* Animated Background with Glassmorphic Elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
            {/* Floating Glassmorphic Orbs */}
            <div className="absolute top-20 left-10 w-32 h-32 bg-white/20 backdrop-blur-xl rounded-full border border-white/30 shadow-xl animate-pulse"></div>
            <div className="absolute top-40 right-20 w-24 h-24 bg-blue-500/10 backdrop-blur-xl rounded-full border border-blue-200/30 shadow-lg animate-pulse delay-1000"></div>
            <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-slate-500/10 backdrop-blur-xl rounded-full border border-slate-200/30 shadow-lg animate-pulse delay-2000"></div>
            <div className="absolute bottom-20 right-1/3 w-28 h-28 bg-white/15 backdrop-blur-xl rounded-full border border-white/25 shadow-xl animate-pulse delay-500"></div>
            
            {/* Subtle Pattern Overlay */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23f1f5f9" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')`
            }}></div>
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-32 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-16">
              <div className="relative">
                <div className="absolute -inset-x-6 -inset-y-6 bg-gradient-to-r from-blue-600/5 to-slate-600/5 rounded-3xl -z-10"></div>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 leading-tight">
                  Smart{" "}
                  <span className="bg-gradient-to-r from-blue-600 via-slate-600 to-indigo-600 bg-clip-text text-transparent">
                    Contract Management
                  </span>{" "}
                  for MSPs & SMBs
                </h1>
                <p className="mt-6 text-xl text-slate-600 leading-relaxed max-w-2xl">
                  Transform your contract management with AI that extracts clauses, analyzes pricing, generates RFPs, 
                  and provides instant insights. Stop losing thousands to missed renewals and overpriced contracts.
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
                    <div className="h-2 w-2 rounded-full bg-blue-400"></div>
                    <span>AI-powered contract analysis</span>
                  </div>
                </div>
              </div>

              {/* Premium Glassmorphic Illustration */}
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-slate-500/20 rounded-3xl blur-xl"></div>
                <div className="relative mx-auto w-full max-w-lg rounded-3xl bg-white/80 backdrop-blur-xl p-8 shadow-2xl border border-white/30">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 rounded-full bg-green-400"></div>
                      <div className="h-4 w-4 rounded-full bg-yellow-400"></div>
                      <div className="h-4 w-4 rounded-full bg-red-400"></div>
                      <div className="ml-auto text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        AI CONTRACT MANAGER
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between bg-blue-50/50 backdrop-blur-sm p-4 rounded-xl border border-blue-100/50">
                        <div className="flex items-center gap-3">
                          <Brain className="h-4 w-4 text-blue-600" />
                          <div>
                            <div className="w-16 h-2 bg-blue-200 rounded mb-2"></div>
                            <div className="w-12 h-1.5 bg-blue-300 rounded"></div>
                          </div>
                        </div>
                        <div className="text-xs font-bold text-blue-700 bg-blue-100/80 backdrop-blur-sm px-2 py-1 rounded">AI Analysis</div>
                      </div>
                      
                      <div className="flex items-center justify-between bg-green-50/50 backdrop-blur-sm p-4 rounded-xl border border-green-100/50">
                        <div className="flex items-center gap-3">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <div>
                            <div className="w-20 h-2 bg-green-200 rounded mb-2"></div>
                            <div className="w-14 h-1.5 bg-green-300 rounded"></div>
                          </div>
                        </div>
                        <div className="text-xs font-bold text-green-700 bg-green-100/80 backdrop-blur-sm px-2 py-1 rounded">Price Alert</div>
                      </div>
                      
                      <div className="flex items-center justify-between bg-slate-50/50 backdrop-blur-sm p-4 rounded-xl border border-slate-100/50">
                        <div className="flex items-center gap-3">
                          <MessageCircle className="h-4 w-4 text-slate-600" />
                          <div>
                            <div className="w-12 h-2 bg-slate-200 rounded mb-2"></div>
                            <div className="w-8 h-1.5 bg-slate-300 rounded"></div>
                          </div>
                        </div>
                        <div className="text-xs font-bold text-slate-700 bg-slate-100/80 backdrop-blur-sm px-2 py-1 rounded">AI Assistant</div>
                      </div>
                      
                      <div className="flex justify-center items-center gap-4 mt-6">
                        <div className="h-6 w-6 rounded-full bg-gradient-to-r from-blue-500 to-slate-500 shadow-lg animate-pulse"></div>
                        <span className="text-xs font-medium text-slate-600 tracking-wide">AI-Powered Insights</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 text-center text-xs text-slate-500 font-medium">Live Dashboard Preview</div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Continuous Content Flow - No Section Breaks */}
        <div ref={contentRef} className="relative">
          {/* AI Features - Seamlessly Connected */}
          <div className="relative py-32 bg-gradient-to-b from-white via-slate-50/20 to-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-4xl mx-auto mb-20">
                <div className="inline-flex items-center rounded-full bg-white/60 backdrop-blur-xl border border-white/30 px-4 py-2 mb-6 text-sm font-semibold text-slate-700">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Smart Contract Intelligence
                </div>
                <h2 className="text-4xl lg:text-5xl font-black text-slate-900 leading-tight">
                  Never Miss a{" "}
                  <span className="bg-gradient-to-r from-blue-600 via-slate-600 to-indigo-600 bg-clip-text text-transparent">
                    Contract Renewal
                  </span>{" "}
                  Again
                </h2>
                <p className="mt-6 text-xl text-slate-600 leading-relaxed">
                  Transform your contract management with intelligent automation that extracts clauses, analyzes pricing, generates RFPs, and provides instant insights.
                </p>
              </div>

              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                <FeatureCard
                  icon={<Brain className="h-7 w-7" />}
                  title="AI Clause Extraction"
                  blurb="Upload any contract PDF and watch our AI instantly identify key clauses like auto-renewal terms, termination notices, price escalators, and penalty clauses."
                  color="slate"
                />
                <FeatureCard
                  icon={<DollarSign className="h-7 w-7" />}
                  title="Live Pricing Analysis"
                  blurb="Compare your contract rates against industry benchmarks in real-time. Get instant alerts when vendor pricing exceeds market rates by 10% or more."
                  color="green"
                />
                <FeatureCard
                  icon={<ClipboardList className="h-7 w-7" />}
                  title="Auto-Generated RFPs"
                  blurb="Generate professional RFP templates automatically using your contract data, pricing benchmarks, and clause analysis."
                  color="blue"
                />
                <FeatureCard
                  icon={<MessageCircle className="h-7 w-7" />}
                  title="Contract Assistant"
                  blurb="Ask natural language questions about your contracts and get instant AI-powered insights and renewal recommendations."
                  color="orange"
                />
                <FeatureCard
                  icon={<UploadCloud className="h-7 w-7" />}
                  title="Smart Document Upload"
                  blurb="Seamlessly upload contracts to AWS S3 with automatic AI processing. Our system extracts text, analyzes clauses, and stores everything securely."
                  color="indigo"
                />
                <FeatureCard
                  icon={<LayoutDashboard className="h-7 w-7" />}
                  title="Intelligent Dashboard"
                  blurb="Get real-time insights into contract health, pricing trends, and renewal opportunities. Our AI-powered dashboard shows you exactly what needs attention."
                  color="pink"
                />
              </div>
            </div>
          </div>

          {/* How It Works - Seamless Transition */}
          <div className="relative py-32 bg-gradient-to-b from-slate-50/20 via-white to-slate-50/10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-4xl mx-auto mb-20">
                <div className="inline-flex items-center rounded-full bg-green-50 px-4 py-2 mb-6 text-sm font-semibold text-green-700">
                  <div className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse"></div>
                  Simple Implementation
                </div>
                <h2 className="text-4xl lg:text-5xl font-black text-slate-900 leading-tight">
                  How It Works
                </h2>
                <p className="mt-6 text-xl text-slate-600 leading-relaxed">
                  Deploy value in under 60 minutes. Our workflow adapts to your business size—from SMB simplicity to enterprise automation.
                </p>
              </div>
              <ol className="grid gap-8 sm:grid-cols-3">
                <StepCard
                  step={1}
                  icon={<KeySquare className="h-8 w-8" />}
                  title="Connect or Upload"
                  text="For MSPs: Integrate seamlessly with ConnectWise, Kaseya, or Datto APIs. For SMBs: Simple CSV bulk imports with intelligent vendor mapping."
                  color="blue"
                />
                <StepCard
                  step={2}
                  icon={<ToggleLeft className="h-8 w-8" />}
                  title="Configure Reminder Strategy"
                  text="Customize 120/90/60/30-day alert intervals with stakeholder assignments. Design escalation chains and renewal priority matrices."
                  color="slate"
                />
                <StepCard
                  step={3}
                  icon={<Send className="h-8 w-8" />}
                  title="Automated Execution"
                  text="Enterprise-grade email sequences execute on schedule with full audit trails. Focus on strategic renewals and relationship building."
                  color="green"
                />
              </ol>
            </div>
          </div>

          {/* AI Capabilities Showcase - Glassmorphic Dark Section */}
          <div className="relative py-32 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
            <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-slate-500/10 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
            
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
              <div className="text-center max-w-4xl mx-auto mb-20">
                <div className="inline-flex items-center rounded-full bg-white/10 backdrop-blur-sm px-6 py-3 mb-8 text-sm font-medium text-white border border-white/20">
                  <Zap className="h-4 w-4 mr-2 text-yellow-400" />
                  Powered by GPT-4 & Advanced AI
                </div>
                <h2 className="text-4xl lg:text-6xl font-bold text-white leading-tight mb-6">
                  Transform Your Contracts with{" "}
                  <span className="bg-gradient-to-r from-blue-400 via-white to-slate-300 bg-clip-text text-transparent">
                    Artificial Intelligence
                  </span>
                </h2>
                <p className="text-xl text-slate-300 leading-relaxed">
                  Experience the future of contract management. Our AI doesn't just store your contracts—it understands them, 
                  analyzes them, and provides actionable insights that save you time and money.
                </p>
              </div>

              <div className="grid gap-8 lg:grid-cols-2">
                <AIFeatureCard
                  icon={<Brain className="h-6 w-6" />}
                  title="AI Clause Extraction"
                  description="Upload any contract PDF and our AI instantly identifies critical clauses like auto-renewal terms, termination notices, and penalty clauses."
                  tags={["Auto-Renewal Detection", "Termination Clauses", "Price Escalators"]}
                  color="slate"
                />
                <AIFeatureCard
                  icon={<TrendingUp className="h-6 w-6" />}
                  title="Live Pricing Analysis"
                  description="Compare your contract rates against industry benchmarks in real-time. Get instant alerts when vendor pricing exceeds market rates."
                  tags={["Benchmark Comparison", "Price Alerts", "Cost Optimization"]}
                  color="green"
                />
                <AIFeatureCard
                  icon={<ClipboardList className="h-6 w-6" />}
                  title="Auto-Generated RFPs"
                  description="Generate professional RFP templates automatically using your contract data, pricing benchmarks, and clause analysis."
                  tags={["Template Generation", "Vendor Comparison", "Smart Caching"]}
                  color="blue"
                />
                <AIFeatureCard
                  icon={<MessageCircle className="h-6 w-6" />}
                  title="Contract Assistant"
                  description="Ask natural language questions about your contracts and get instant AI-powered insights and renewal recommendations."
                  tags={["Natural Language", "Usage Predictions", "Smart Insights"]}
                  color="orange"
                />
              </div>
            </div>
          </div>

          {/* Benefits - Seamless Light Transition */}
          <div className="relative py-32 bg-gradient-to-b from-slate-50/10 via-white to-slate-50/20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <div className="inline-flex items-center rounded-full bg-slate-100 px-4 py-2 mb-6 text-sm font-medium text-slate-600">
                  Measurable Results
                </div>
                <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight mb-6">
                  Operational Wins You Can Measure
                </h2>
                <p className="text-lg text-slate-600 leading-relaxed">
                  Quantified productivity gains that protect margins, eliminate churn risk, and enable business growth.
                </p>
              </div>
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                <BenefitItem 
                  text="Save 80% of manual contract tracking time—more strategic focus on revenue growth and business development."
                  metric="80%"
                  description="Time Saved"
                />
                <BenefitItem 
                  text="Eliminate costly auto-renewals and uncaptured vendor cost creep—from SMB budgets to enterprise margins."
                  metric="$50K+"
                  description="Annual Savings"
                />
                <BenefitItem 
                  text="Scale operations efficiently without requiring additional headcount—perfect for growing SMBs and expanding MSPs."
                  metric="3x"
                  description="Productivity"
                />
                <BenefitItem 
                  text="Standardize renewal workflows across all stakeholders—from SMB owners to MSP account teams."
                  metric="100%"
                  description="Consistency"
                />
              </div>
            </div>
          </div>


          {/* Final CTA with Glassmorphic Elements */}
          <div className="relative py-32 bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden">
            {/* Floating Glassmorphic Elements */}
            <div className="absolute top-10 left-10 w-32 h-32 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 shadow-xl animate-pulse"></div>
            <div className="absolute bottom-10 right-10 w-24 h-24 bg-blue-500/10 backdrop-blur-xl rounded-full border border-blue-400/20 shadow-lg animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-slate-500/10 backdrop-blur-xl rounded-full border border-slate-400/20 shadow-lg animate-pulse delay-2000"></div>
            
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative">
              <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
                Ready to never miss another renewal?
              </h2>
              <p className="text-xl text-slate-300 leading-relaxed mb-10">
                Join hundreds of MSPs and SMBs who trust Renlu to protect their margins and streamline their contract management.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleStartFreeTrial}
                  className="inline-flex items-center justify-center rounded-xl bg-white/90 backdrop-blur-xl border border-white/30 px-8 py-4 text-lg font-semibold text-slate-900 hover:bg-white hover:shadow-xl transition-all duration-200"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
                <button
                  onClick={handleSignInClick}
                  className="inline-flex items-center justify-center rounded-xl border-2 border-white/30 bg-white/10 backdrop-blur-xl px-8 py-4 text-lg font-semibold text-white hover:bg-white/20 hover:border-white/50 transition-all duration-200"
                >
                  <KeySquare className="mr-2 h-5 w-5" />
                  Sign In
                </button>
              </div>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <span>14-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <span>Setup in under 10 minutes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer with Glassmorphic Elements */}
          <footer className="relative bg-gradient-to-br from-slate-900 to-slate-800 border-t border-slate-700 overflow-hidden">
            {/* Subtle Glassmorphic Background Elements */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/5 to-transparent"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
            
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 relative">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 mb-12">
                <RenluLogo size={40} variant="white" />
                <nav className="flex flex-wrap items-center gap-8 text-sm text-slate-300">
                  <a href="#features" className="font-medium hover:text-white transition-colors duration-200">Features</a>
                  <a href="#how" className="font-medium hover:text-white transition-colors duration-200">How It Works</a>
                  <a href="#benefits" className="font-medium hover:text-white transition-colors duration-200">Benefits</a>
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
      </div>
    </div>
  );
}

/* ==========================
 * Reusable Subcomponents
 * ==========================
 */

function FeatureCard({ icon, title, blurb, color = "blue" }) {
  const colorClasses = {
    blue: "bg-blue-50/80 text-blue-600 border-blue-200/50 backdrop-blur-sm",
    orange: "bg-orange-50/80 text-orange-600 border-orange-200/50 backdrop-blur-sm", 
    slate: "bg-slate-50/80 text-slate-600 border-slate-200/50 backdrop-blur-sm",
    green: "bg-green-50/80 text-green-600 border-green-200/50 backdrop-blur-sm",
    indigo: "bg-indigo-50/80 text-indigo-600 border-indigo-200/50 backdrop-blur-sm",
    pink: "bg-pink-50/80 text-pink-600 border-pink-200/50 backdrop-blur-sm"
  };
  
  return (
    <div className="group relative rounded-3xl border border-white/30 bg-white/70 backdrop-blur-xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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
    slate: "bg-slate-500 text-white", 
    green: "bg-green-500 text-white"
  };
  
  return (
    <li className="group relative">
      <div className="absolute -inset-4 bg-gradient-to-r from-white/10 to-blue-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-xl"></div>
      <div className="relative rounded-3xl border border-white/30 bg-white/70 backdrop-blur-xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform group-hover:-translate-y-1">
        <div className={`absolute -top-4 left-8 flex h-12 w-12 items-center justify-center rounded-full ${colorClasses[color]} text-lg font-bold shadow-lg`}>
          {step}
        </div>
        <div className="mt-4 flex items-start gap-6">
          <div className={`flex h-16 w-16 items-center justify-center rounded-2xl border-2 backdrop-blur-sm ${
            color === "blue" ? "bg-blue-50/80 text-blue-600 border-blue-200/50" :
            color === "slate" ? "bg-slate-50/80 text-slate-600 border-slate-200/50" :
            "bg-green-50/80 text-green-600 border-green-200/50"
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

function AIFeatureCard({ icon, title, description, tags, color = "slate" }) {
  const colorClasses = {
    slate: "from-slate-500 to-slate-600 border-slate-400/50",
    green: "from-green-500 to-green-600 border-green-400/50",
    blue: "from-blue-500 to-blue-600 border-blue-400/50",
    orange: "from-orange-500 to-orange-600 border-orange-400/50"
  };
  
  const tagColorClasses = {
    slate: "bg-slate-500/20 text-slate-300",
    green: "bg-green-500/20 text-green-300",
    blue: "bg-blue-500/20 text-blue-300",
    orange: "bg-orange-500/20 text-orange-300"
  };
  
  return (
    <div className={`group relative bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 hover:border-white/40 transition-all duration-300`}>
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 w-12 h-12 bg-gradient-to-br ${colorClasses[color]} rounded-xl flex items-center justify-center`}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
          <p className="text-slate-300 mb-4">
            {description}
          </p>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span key={index} className={`px-3 py-1 ${tagColorClasses[color]} text-xs rounded-full backdrop-blur-sm`}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BenefitItem({ text, metric, description }) {
  return (
    <div className="group relative rounded-xl bg-white/70 backdrop-blur-xl p-8 border border-white/30 hover:border-white/50 hover:shadow-xl transition-all duration-300">
      <div className="space-y-4">
        <div className="text-4xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-300">
          {metric}
        </div>
        <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">
          {description}
        </div>
        <div className="text-slate-700 leading-relaxed">
          {text}
        </div>
      </div>
    </div>
  );
}
