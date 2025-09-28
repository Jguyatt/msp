import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser, useClerk } from '@clerk/clerk-react';
import {
  ShieldCheck,
  Search,
  Bell,
  Menu,
  X,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Zap,
  AlertTriangle,
  Clock,
  CheckCircle,
  Home,
  FileText,
  Upload
} from 'lucide-react';
import useDisclosure from '../hooks/useDisclosure';
import RenluLogo from '../../components/RenluLogo';
import { useUserSync } from '../../hooks/useUserSync';
import { contractService } from '../../services/supabaseService';

function SideNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { clerkUser, supabaseUser, loading: userLoading } = useUserSync();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Update main content margin when sidebar state changes
  useEffect(() => {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.style.marginLeft = sidebarCollapsed ? '4rem' : '16rem';
    }
  }, [sidebarCollapsed]);
  
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (userLoading || !supabaseUser) return;
      
      try {
        setLoadingNotifications(true);
        const contracts = await contractService.getContractsForUser(supabaseUser.email);
        
        // Create mock notifications based on contracts
        const mockNotifications = contracts.slice(0, 3).map((contract, index) => ({
          id: `notification-${index}`,
          title: `Contract "${contract.contract_name}" expires in ${Math.floor(Math.random() * 30) + 1} days`,
          message: `Vendor: ${contract.vendor}`,
          time: new Date(Date.now() - index * 3600000).toISOString(),
          type: 'contract_expiry',
          read: false
        }));
        
        setNotifications(mockNotifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoadingNotifications(false);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [clerkUser, supabaseUser, userLoading]);

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
    { name: 'Dashboard', path: '/app/dashboard', icon: Home },
    { name: 'Contracts', path: '/app/contracts', icon: FileText },
    { name: 'Upload', path: '/app/upload', icon: Upload }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-slate-900 border-r border-slate-800 z-50 transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          {!sidebarCollapsed && <RenluLogo size={32} variant="white" />}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Menu className="h-5 w-5 text-slate-300" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive(link.path)
                        ? 'bg-slate-800 text-white border-r-2 border-slate-300'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <span className="text-sm font-medium">{link.name}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-slate-800">
          {/* Upgrade Button */}
          <Link
            to="/app/plans"
            className="w-full flex items-center gap-3 px-3 py-2 bg-gradient-to-r from-slate-700 to-slate-600 text-white rounded-lg hover:from-slate-600 hover:to-slate-500 transition-all duration-200 mb-4"
          >
            <Zap className="h-4 w-4 flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-sm font-medium">Upgrade</span>}
          </Link>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-slate-300" />
              </div>
              {!sidebarCollapsed && (
                <>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-slate-200">
                      {user?.firstName || 'User'}
                    </div>
                    <div className="text-xs text-slate-400">
                      {user?.emailAddresses?.[0]?.emailAddress || 'user@example.com'}
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </>
              )}
            </button>

            {/* Profile Dropdown */}
            {showProfile && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <div className="p-2">
                  <Link
                    to="/app/settings"
                    className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    onClick={() => setShowProfile(false)}
                  >
                    <Settings className="h-4 w-4" />
                    <span className="text-sm">Settings</span>
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setShowProfile(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="text-sm">Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Bar */}
      <div className="fixed top-0 h-16 bg-slate-50 border-b border-slate-200 z-40 transition-all duration-300" 
           style={{ left: sidebarCollapsed ? '4rem' : '16rem', right: 0 }}>
        <div className="flex items-center justify-between h-full px-6">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search contracts, vendors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent bg-white"
              />
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {loadingNotifications ? (
                      <div className="p-4 text-center text-gray-500">Loading...</div>
                    ) : notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">No notifications</div>
                    ) : (
                      notifications.map((notification) => (
                        <div key={notification.id} className="p-4 border-b border-gray-100 hover:bg-gray-50">
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                              <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(notification.time).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Status Indicator */}
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>All Good</span>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {showSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Search className="h-5 w-5 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search contracts, vendors, or contract names..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
                  className="flex-1 text-lg border-none outline-none"
                  autoFocus
                />
                <button
                  onClick={() => setShowSearch(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
            </div>
            <div className="p-4 text-sm text-gray-500">
              Press <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Esc</kbd> to close
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SideNav;
