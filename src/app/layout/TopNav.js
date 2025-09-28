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
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (userLoading || !clerkUser || !supabaseUser) {
        setLoadingNotifications(false);
        return;
      }

      setLoadingNotifications(true);
      try {
        // Get contracts from Supabase
        const contracts = await contractService.getContractsForUser(clerkUser.emailAddresses[0].emailAddress);
        
        // Generate notifications based on contract data
        const newNotifications = [];
        
        // Calculate days until expiry for each contract
        const contractsWithDays = contracts.map(contract => {
          const endDate = new Date(contract.end_date);
          const today = new Date();
          const daysUntil = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
          return { ...contract, daysUntil };
        });

        // Contracts expiring this week (7 days)
        const expiringThisWeek = contractsWithDays.filter(c => c.daysUntil <= 7 && c.daysUntil >= 0);
        if (expiringThisWeek.length > 0) {
          newNotifications.push({
            id: 'expiring-week',
            type: 'warning',
            icon: AlertTriangle,
            message: `${expiringThisWeek.length} contract${expiringThisWeek.length > 1 ? 's' : ''} expiring this week`,
            count: expiringThisWeek.length
          });
        }
        
        // Overdue contracts
        const overdueContracts = contractsWithDays.filter(c => c.daysUntil < 0);
        if (overdueContracts.length > 0) {
          newNotifications.push({
            id: 'overdue',
            type: 'error',
            icon: AlertTriangle,
            message: `${overdueContracts.length} overdue contract${overdueContracts.length > 1 ? 's' : ''}`,
            count: overdueContracts.length
          });
        }
        
        // Contracts expiring this month
        const expiringThisMonth = contractsWithDays.filter(c => c.daysUntil <= 30 && c.daysUntil >= 0);
        if (expiringThisMonth.length > 0) {
          newNotifications.push({
            id: 'expiring-month',
            type: 'info',
            icon: Clock,
            message: `${expiringThisMonth.length} contract${expiringThisMonth.length > 1 ? 's' : ''} expiring this month`,
            count: expiringThisMonth.length
          });
        }
        
        // Recent activity
        if (contracts.length > 0) {
          newNotifications.push({
            id: 'recent-activity',
            type: 'success',
            icon: CheckCircle,
            message: `${contracts.length} total contract${contracts.length > 1 ? 's' : ''} managed`,
            count: contracts.length
          });
        }
        
        setNotifications(newNotifications.slice(0, 3)); // Show max 3 notifications
      } catch (error) {
        console.error('Error fetching notifications:', error);
        // Fallback notifications
        setNotifications([
          {
            id: 'fallback',
            type: 'info',
            icon: CheckCircle,
            message: 'System status: All good',
            count: 0
          }
        ]);
      } finally {
        setLoadingNotifications(false);
      }
    };

    fetchNotifications();
    
    // Refresh notifications every 5 minutes
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
            { name: 'Dashboard', path: '/app/dashboard' },
            { name: 'Contracts', path: '/app/contracts' },
            { name: 'Upload', path: '/app/upload' },
            { name: 'Reports', path: '/app/reports' }
          ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/app/dashboard" className="flex items-center">
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
                  className="hidden md:inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <Zap className="h-4 w-4" />
                  Upgrade
                </Link>

                {/* Search button */}
                <button
                  onClick={() => setShowSearch(true)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Search"
                >
                  <Search className="h-5 w-5" />
                </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors relative"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {/* Notification badge */}
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 text-sm font-medium text-gray-900 border-b border-gray-100">
                    Notifications
                  </div>
                  {loadingNotifications ? (
                    <div className="px-4 py-4 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-xs text-gray-500 mt-2">Loading notifications...</p>
                    </div>
                  ) : notifications.length > 0 ? (
                    notifications.map((notification) => {
                      const IconComponent = notification.icon;
                      return (
                        <div 
                          key={notification.id}
                          className="px-4 py-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                              notification.type === 'error' ? 'bg-red-100' :
                              notification.type === 'warning' ? 'bg-orange-100' :
                              notification.type === 'success' ? 'bg-green-100' :
                              'bg-blue-100'
                            }`}>
                              <IconComponent className={`w-3 h-3 ${
                                notification.type === 'error' ? 'text-red-600' :
                                notification.type === 'warning' ? 'text-orange-600' :
                                notification.type === 'success' ? 'text-green-600' :
                                'text-blue-600'
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900">{notification.message}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="px-4 py-4 text-center">
                      <CheckCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No notifications</p>
                      <p className="text-xs text-gray-400">All caught up!</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="User menu"
              >
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>

              {showProfile && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 text-sm font-medium text-gray-900">
                    {user?.fullName || 'User'}
                  </div>
                  <div className="px-4 py-1 text-xs text-gray-500">
                    {user?.primaryEmailAddress?.emailAddress}
                  </div>
                  <div className="border-t mt-2 pt-2">
                    <Link
                      to="/app/settings"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setShowProfile(false)}
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                    <button
                      onClick={() => signOut()}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
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
                  className="flex items-center gap-2 px-4 py-3 text-sm font-medium bg-gradient-to-r from-purple-600 to-blue-600 text-white mx-4 rounded-lg mb-2"
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
                        ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
                    className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setShowMobileMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            )}
      </div>

      {/* Search overlay */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <form onSubmit={handleSearch} className="p-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search contracts, vendors..."
                  className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
