import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser, useClerk } from '@clerk/clerk-react';
import {
  ShieldCheck,
  Search,
  Menu,
  X,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Zap,
  AlertTriangle,
  Clock,
  CheckCircle
} from 'lucide-react';
import useDisclosure from '../hooks/useDisclosure';
import RenluLogo from '../../components/RenluLogo';
import { useUserSync } from '../../hooks/useUserSync';
import { contractService } from '../../services/supabaseService';

function TopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { clerkUser, supabaseUser, loading: userLoading } = useUserSync();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);


  // Handle Cmd/Ctrl+K shortcut
  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
        setTimeout(() => {
          if (searchInputRef.current) {
            searchInputRef.current.focus();
          }
        }, 0);
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
        setShowNotifications(false);
        setShowProfile(false);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to contracts with search query
      navigate(`/app/contracts?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setShowSearch(false);
    }
  };

          const navLinks = [
            { name: 'Dashboard', path: '/app/dashboard' },
            { name: 'Contracts', path: '/app/contracts' },
            { name: 'Reports', path: '/app/reports' }
          ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white/90 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center">
            <RenluLogo size={32} variant="default" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-sm font-medium transition-colors relative ${
                  isActive(link.path)
                    ? 'text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {link.name}
                {isActive(link.path) && (
                  <div className="absolute -bottom-6 left-0 right-0 h-0.5 bg-blue-600"></div>
                )}
              </Link>
            ))}
          </div>

              {/* Right side utilities */}
              <div className="flex items-center gap-4">
                {/* Upgrade button */}
                <Link
                  to="/app/plans"
                  className="hidden md:inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-slate-600 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-slate-700 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md backdrop-blur-sm"
                >
                  <Zap className="h-4 w-4" />
                  Upgrade
                </Link>

                {/* Search button */}
                <button
                  onClick={() => setShowSearch(true)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 backdrop-blur-sm rounded-lg transition-colors"
                  aria-label="Search"
                >
                  <Search className="h-5 w-5" />
                </button>


            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center gap-3 p-2 hover:bg-gray-100/50 backdrop-blur-sm rounded-lg transition-colors"
                aria-label="User menu"
              >
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>

              {showProfile && (
                <div className="absolute right-0 mt-2 w-48 bg-white/90 backdrop-blur-xl rounded-lg shadow-xl border border-white/30 py-2 z-50">
                  <div className="px-4 py-2 text-sm font-medium text-gray-900">
                    {user?.fullName || 'User'}
                  </div>
                  <div className="px-4 py-1 text-xs text-gray-500">
                    {user?.primaryEmailAddress?.emailAddress}
                  </div>
                  <div className="border-t mt-2 pt-2">
                    <Link
                      to="/app/settings"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-white/50 backdrop-blur-sm"
                      onClick={() => setShowProfile(false)}
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                    <button
                      onClick={() => signOut()}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-white/50 backdrop-blur-sm w-full text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-gray-500 hover:text-gray-700 rounded-lg"
              aria-label="Menu"
            >
              {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

            {/* Mobile menu */}
            {showMobileMenu && (
              <div className="md:hidden border-t border-gray-200 py-2">
                {/* Mobile Upgrade Button */}
                <Link
                  to="/app/plans"
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center gap-2 px-4 py-3 text-sm font-medium bg-gradient-to-r from-slate-600 to-blue-600 text-white mx-4 rounded-lg mb-2 backdrop-blur-sm"
                >
                  <Zap className="h-4 w-4" />
                  Upgrade Plan
                </Link>

                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setShowMobileMenu(false)}
                    className={`block px-4 py-3 text-sm font-medium ${
                      isActive(link.path)
                        ? 'bg-blue-50/80 text-blue-700 border-r-4 border-blue-600 backdrop-blur-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/50 backdrop-blur-sm'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
                
                {/* Mobile user section */}
                <div className="border-t border-gray-200 mt-2 pt-2">
                  <div className="px-4 py-2">
                    <div className="text-sm font-medium text-gray-900">
                      {user?.fullName || 'User'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user?.primaryEmailAddress?.emailAddress}
                    </div>
                  </div>
                  <Link
                    to="/app/settings"
                    onClick={() => setShowMobileMenu(false)}
                    className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50/50 backdrop-blur-sm"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setShowMobileMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50/50 backdrop-blur-sm"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            )}
      </div>

      {/* Search overlay */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20">
          <div className="bg-white/90 backdrop-blur-xl rounded-lg shadow-xl border border-white/30 w-full max-w-lg mx-4">
            <form onSubmit={handleSearch} className="p-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search contracts, vendors..."
                  className="w-full pl-12 pr-4 py-4 border border-gray-300/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                  autoFocus
                />
              </div>
              <div className="mt-3 text-xs text-gray-500">
                Press Esc to close
              </div>
            </form>
          </div>
        </div>
      )}
    </nav>
  );
}

export default TopNav;
