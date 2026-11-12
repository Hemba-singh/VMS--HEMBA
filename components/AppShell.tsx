'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Users,
  Home,
  MapPin,
  Upload,
  BarChart3,
  UserCog,
  Settings,
  Search,
  Bell,
  Shield,
  ChevronDown,
  Eye,
  EyeOff,
  Menu,
  X,
  LogOut,
  AlertCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  Monitor,
  User,
  Hash,
  ArrowRight,
  CornerDownLeft,
  Map as MapIcon,
  Lock,
  KeyRound,
} from 'lucide-react';
import { useStore, matchesFuzzyQuery, SearchScope } from '@/lib/store-context';
import { NavigationTab, Voter } from '@/lib/types';
import dynamic from 'next/dynamic';
import VoterListView from './VoterListView';

const FamilyView = dynamic(() => import('./FamilyView'), {
  loading: () => <div className="p-8 text-center text-sm text-slate-500">Loading Family View...</div>,
});
const VillagesStationsView = dynamic(() => import('./VillagesStationsView'), {
  loading: () => <div className="p-8 text-center text-sm text-slate-500">Loading Villages & Stations...</div>,
});
const MapsView = dynamic(() => import('./MapsView'), {
  loading: () => <div className="p-8 text-center text-sm text-slate-500">Loading Maps...</div>,
});
const ImportDataView = dynamic(() => import('./ImportDataView'), {
  loading: () => <div className="p-8 text-center text-sm text-slate-500">Loading Import View...</div>,
});
const ReportsView = dynamic(() => import('./ReportsView'), {
  loading: () => <div className="p-8 text-center text-sm text-slate-500">Loading Analytics & Reports...</div>,
});
const UsersView = dynamic(() => import('./UsersView'), {
  loading: () => <div className="p-8 text-center text-sm text-slate-500">Loading Users & RBAC...</div>,
});
const SettingsView = dynamic(() => import('./SettingsView'), {
  loading: () => <div className="p-8 text-center text-sm text-slate-500">Loading Settings...</div>,
});

const NAV_ITEMS: { id: NavigationTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'voter-list', label: 'Voter List', icon: Users },
  { id: 'family-view', label: 'Family View', icon: Home },
  { id: 'villages-stations', label: 'Villages & Polling Stations', icon: MapPin },
  { id: 'maps', label: 'Maps', icon: MapIcon },
  { id: 'import-data', label: 'Import Data', icon: Upload },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'users', label: 'Users', icon: UserCog },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function AppShell() {
  const {
    themeMode,
    resolvedTheme,
    setThemeMode,
    cycleThemeMode,
    activeTab,
    setActiveTab,
    globalSearch,
    setGlobalSearch,
    searchScope,
    setSearchScope,
    isSidebarCollapsed,
    toggleSidebarCollapsed,
    isMobileMenuOpen: mobileMenuOpen,
    setIsMobileMenuOpen: setMobileMenuOpen,
    isNotificationsOpen: showNotifications,
    setIsNotificationsOpen: setShowNotifications,
    isUserMenuOpen: showUserMenu,
    setIsUserMenuOpen: setShowUserMenu,
    currentUser,
    users,
    voters,
    scopedFamilies,
    scopedPollingStations,
    isAuthenticated,
    isSessionLocked,
    isAuthHydrated,
    authError,
    clearAuthError,
    lockSession,
    authenticateWithRoleCredentials,
    tasks,
    voterNotifications,
    exportRequests,
    unassignedImports,
    setSelectedVoterId,
    revealFullPhone,
    setRevealFullPhone,
    canUnmaskPhone,
    canImportData,
    canAccessTab,
    toasts,
    dismissToast,
  } = useStore();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authPin, setAuthPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleAuthGateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = authenticateWithRoleCredentials(authEmail, authPassword, authPin);
    if (ok) {
      setAuthPassword('');
      setAuthPin('');
    }
  };

  // Keyboard shortcut listener (⌘K / Ctrl+K or / to focus search, Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      } else if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close live search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Real-time matching voters across Name, House Number, and Voter ID
  const matchingVoters = useMemo(() => {
    if (!globalSearch.trim()) return [];
    const famMap = new Map(scopedFamilies.map((f) => [f.id, f.familyCode]));
    return voters.filter((v) => matchesFuzzyQuery(v, globalSearch, famMap.get(v.familyId), searchScope));
  }, [voters, globalSearch, scopedFamilies, searchScope]);

  // Determine what matched for highlighting in search preview
  const getMatchReason = (voter: Voter, query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    const house = (voter.houseNo || '').toLowerCase();
    const epic = (voter.epicNo || '').toLowerCase();
    const vId = (voter.id || '').toLowerCase();
    const name = (voter.name || '').toLowerCase();

    if (house.includes(q) || (voter.addressId && voter.addressId.toLowerCase().includes(q))) {
      return { type: 'houseNo', label: `House No: ${voter.houseNo || voter.addressId.split(',')[0]}`, icon: Home };
    }
    if (epic.includes(q) || vId.includes(q) || String(voter.serialNo) === q) {
      return { type: 'voterId', label: `Voter ID: ${voter.epicNo}`, icon: Hash };
    }
    if (name.includes(q)) {
      return { type: 'name', label: `Name match: ${voter.name}`, icon: User };
    }
    return { type: 'all', label: 'Electoral Record', icon: Search };
  };

  const handleSelectVoter = (voterId: string) => {
    if (activeTab !== 'voter-list') {
      setActiveTab('voter-list');
    }
    setSelectedVoterId(voterId);
    setIsSearchOpen(false);
  };

  const overdueTasks = tasks.filter((t) => t.status === 'Overdue');
  const pendingExports = exportRequests.filter((e) => e.status === 'Pending Approval');
  const recentVoterNotifications = voterNotifications.slice(0, 5);
  const notificationCount =
    overdueTasks.length + pendingExports.length + unassignedImports.length + recentVoterNotifications.length;

  const getNavBadge = (id: NavigationTab): string | number | null => {
    if (id === 'voter-list') return voters.length;
    if (id === 'family-view') return scopedFamilies.length;
    if (id === 'villages-stations') return `PS 1–${scopedPollingStations.length}`;
    if (id === 'import-data' && unassignedImports.length > 0) return unassignedImports.length;
    if (id === 'users') return users.length;
    return null;
  };

  // Prevent login flash while hydrating persisted session on client mount
  if (!isAuthHydrated) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0b192c] text-white gap-3">
        <div className="h-11 w-11 rounded-2xl bg-[#0071e3] flex items-center justify-center shadow-lg">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div className="text-xs font-medium text-slate-300 tracking-wide">
          Restoring AC-31 Thoubal Security Session...
        </div>
      </div>
    );
  }

  // Authentication State Guard: Redirect unauthorized users to the Login Screen and display application content ONLY for authenticated users
  if (!isAuthenticated || isSessionLocked || !currentUser?.active) {
    return (
      <div className="min-h-screen w-full flex flex-col justify-between bg-[#0b192c] text-white selection:bg-[#0071e3] selection:text-white">
        {/* Top Portal Header */}
        <header className="w-full max-w-6xl mx-auto px-6 py-5 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[#0071e3] flex items-center justify-center shadow-lg">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-blue-400">
                MANIPUR · 31-THOUBAL ASSEMBLY CONSTITUENCY
              </div>
              <div className="text-sm sm:text-base font-bold tracking-tight text-white">
                AC-31 Thoubal Voter List Management System
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cycleThemeMode}
              title={`Theme: ${themeMode}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10 transition-colors"
            >
              {resolvedTheme === 'dark' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline capitalize">{themeMode}</span>
            </button>
          </div>
        </header>

        {/* Center Authentication Grid */}
        <main className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6">
          <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Security & Booth Isolation Overview */}
            <div className="lg:col-span-5 space-y-5 text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold text-blue-300">
                <Lock className="h-3.5 w-3.5" />
                <span>Mandatory Email &amp; Security PIN Authentication</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
                Sign in to access AC-31 Thoubal Electoral Records
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                All voter roll records, household trees, GIS coordinates, and field workflows across the 41 official CEO Manipur Polling Stations (PS 1–41) are protected by role-scoped authentication.
              </p>

              <div className="space-y-3 pt-1 text-xs">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-white">Polling Station Scope Isolation (PS 1–41)</div>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Booth Incharges and Field Workers only see voters, households, and tasks assigned to their authorized polling station(s).
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 flex items-start gap-3">
                  <EyeOff className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-white">Voter PII &amp; Phone Number Masking</div>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Phone numbers remain masked (`98XXXXXX21`) by default. Unmasking and CSV exports are restricted by role and logged to the Audit Trail.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Official Email + Password + Security PIN Login Card */}
            <div className="lg:col-span-7">
              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1c1c1e] text-slate-900 dark:text-slate-100 p-6 sm:p-7 shadow-2xl space-y-5 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#0071e3]">
                      OFFICIAL LOGIN PORTAL · EMAIL, PASSWORD &amp; PIN
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                      Authenticate Your Constituency Session
                    </h2>
                  </div>
                  <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                    41 Booths Protected
                  </span>
                </div>

                {authError && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-3.5 py-2.5 flex items-start gap-2.5 text-red-700 dark:text-red-300"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                    <div className="space-y-0.5">
                      <div className="font-semibold text-xs">Authentication Verification Failed</div>
                      <p className="text-[11px] leading-relaxed">{authError.message}</p>
                    </div>
                  </div>
                )}

                {/* Official Email + Password + Role Security PIN Form */}
                <form onSubmit={handleAuthGateSubmit} className="space-y-3.5">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Official Email Address
                    </label>
                    <input
                      type="email"
                      required
                      autoComplete="username"
                      value={authEmail}
                      onChange={(e) => {
                        setAuthEmail(e.target.value);
                        if (authError) clearAuthError();
                      }}
                      placeholder="Enter official email address"
                      className={`w-full rounded-xl border ${
                        authError?.field === 'email' || authError?.field === 'account'
                          ? 'border-red-500 focus:border-red-600'
                          : 'border-slate-300 dark:border-slate-700 focus:border-[#0071e3]'
                      } bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 font-mono text-slate-900 dark:text-slate-100 focus:outline-none`}
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Account Password
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="current-password"
                        value={authPassword}
                        onChange={(e) => {
                          setAuthPassword(e.target.value);
                          if (authError) clearAuthError();
                        }}
                        placeholder="Enter account password"
                        className={`w-full rounded-xl border ${
                          authError?.field === 'password'
                            ? 'border-red-500 focus:border-red-600'
                            : 'border-slate-300 dark:border-slate-700 focus:border-[#0071e3]'
                        } bg-slate-50 dark:bg-slate-900 pl-10 pr-16 py-2.5 font-mono text-slate-900 dark:text-slate-100 focus:outline-none`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      4-Digit Role Security PIN
                    </label>
                    <div className="relative flex items-center">
                      <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type={showPin ? 'text' : 'password'}
                        inputMode="numeric"
                        maxLength={6}
                        required
                        value={authPin}
                        onChange={(e) => {
                          setAuthPin(e.target.value.replace(/[^0-9]/g, ''));
                          if (authError) clearAuthError();
                        }}
                        placeholder="Enter 4-digit Security PIN"
                        className={`w-full rounded-xl border ${
                          authError?.field === 'pin'
                            ? 'border-red-500 focus:border-red-600'
                            : 'border-slate-300 dark:border-slate-700 focus:border-[#0071e3]'
                        } bg-slate-50 dark:bg-slate-900 pl-10 pr-16 py-2.5 font-mono tabular-nums tracking-widest text-slate-900 dark:text-slate-100 focus:outline-none`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin((prev) => !prev)}
                        className="absolute right-3 text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      >
                        {showPin ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-full bg-[#0071e3] py-3 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    Sign In to AC-31 Thoubal Portal
                  </button>
                </form>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-3.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Session Persists Until Explicit Sign-Out</span>
                  <span className="font-mono text-[10px]">Multi-Factor · DPDP 2023</span>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full max-w-6xl mx-auto px-6 py-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <span>31-Thoubal Assembly Constituency · Electoral Roll & Booth Management</span>
          <span className="font-mono">RBAC v2.4 · 41 Polling Stations</span>
        </footer>

        {/* Bottom-Center Toast Notifications on Login Screen */}
        {toasts.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2.5 w-full max-w-md px-4 pointer-events-none">
            {toasts.map((t) => (
              <div
                key={t.id}
                className={`pointer-events-auto flex items-center justify-between gap-3 rounded-[20px] border px-5 py-3.5 shadow-lg text-[14px] ${
                  t.variant === 'danger'
                    ? 'bg-[#ff3b30] border-[#ff3b30] text-white'
                    : 'bg-[#1d1d1f] border-[#38383a] text-[#f5f5f7]'
                }`}
              >
                <div>
                  <div className="font-semibold">{t.title}</div>
                  {t.description && <div className="text-[13px] text-[#a1a1a6] mt-0.5">{t.description}</div>}
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(t.id)}
                  className="text-[#a1a1a6] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden flex bg-[#f5f5f7] dark:bg-[#000000] text-[#1d1d1f] dark:text-[#f5f5f7] transition-colors duration-200">
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Dark Navy Left Sidebar */}
      <aside
        aria-label="Primary Sidebar Navigation"
        className={`fixed inset-y-0 left-0 z-40 h-full ${
          isSidebarCollapsed ? 'lg:w-20 w-64' : 'w-64'
        } bg-[#0b192c] text-white flex flex-col justify-between transition-all duration-200 ease-out lg:translate-x-0 lg:static lg:shrink-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Sidebar Brand Header */}
          <div className="px-4 py-5 border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
            {!isSidebarCollapsed ? (
              <div className="min-w-0">
                <div className="text-[11px] font-bold uppercase tracking-widest text-blue-400 truncate">
                  MANIPUR · CONSTITUENCY 31
                </div>
                <div className="text-base font-bold tracking-tight text-white mt-0.5 truncate">
                  AC-31 THOUBAL
                </div>
                <div className="text-[11px] text-slate-400 truncate">Voter List Management System</div>
              </div>
            ) : (
              <div className="mx-auto text-xs font-bold tracking-tight text-blue-400 font-mono">
                AC-31
              </div>
            )}
            <button
              type="button"
              onClick={toggleSidebarCollapsed}
              title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              className="hidden lg:inline-flex text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10"
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close navigation menu"
              className="lg:hidden text-slate-400 hover:text-white p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Sidebar Navigation Links */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {NAV_ITEMS.filter((item) => canAccessTab(item.id)).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const badge = getNavBadge(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  title={item.label}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full min-h-[44px] flex items-center ${
                    isSidebarCollapsed ? 'lg:justify-center' : 'justify-between'
                  } gap-2.5 rounded-full px-4 py-2.5 text-[14px] font-medium transition-colors ${
                    isActive
                      ? 'bg-[#0071e3] text-white'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className={`truncate ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
                  </span>
                  {badge !== null && (
                    <span
                      className={`text-[12px] font-mono tabular-nums px-2 py-0.5 rounded-full shrink-0 ${
                        isSidebarCollapsed ? 'lg:hidden' : ''
                      } ${isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-slate-300'}`}
                    >
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Bottom Role & Polling Station Scope Summary */}
        <div className="p-4 border-t border-white/10 space-y-2 text-xs shrink-0">
          {!isSidebarCollapsed ? (
            <div className="rounded-xl bg-white/5 p-3 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Authenticated Role Scope</span>
                <Shield className="h-3.5 w-3.5 text-blue-400" />
              </div>
              <div className="font-semibold text-white truncate">{currentUser.role}</div>
              <div className="text-[11px] text-slate-300 font-mono truncate">
                {currentUser.pollingStationIds.includes('ALL')
                  ? 'Scope: All 41 Stations (PS 1–41)'
                  : `Scope: ${currentUser.pollingStationIds.map((p) => p.toUpperCase()).join(', ')}`}
              </div>
              <button
                type="button"
                onClick={lockSession}
                className="w-full mt-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/15 py-1.5 text-[11px] font-semibold text-slate-200 transition-colors"
              >
                <Lock className="h-3 w-3" />
                <span>Lock / Switch Role Auth</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={lockSession}
              className="w-full flex justify-center p-2 rounded-lg hover:bg-white/10"
              title={`${currentUser.role} (${currentUser.pollingStationIds.join(', ')}) — Click to Lock/Switch Auth`}
            >
              <Lock className="h-4 w-4 text-blue-400" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header (56px height, translucent with backdrop blur, hairline #d2d2d7 / #38383a) */}
        <header className="shrink-0 relative z-30 h-14 bg-white/85 dark:bg-[#1c1c1e]/85 backdrop-blur-md border-b border-[#d2d2d7] dark:border-[#38383a] px-4 lg:px-6 flex items-center justify-between gap-4">
          {/* Left: Application Title */}
          <div className="flex items-center gap-3 min-w-0 shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden h-11 w-11 inline-flex items-center justify-center rounded-full text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#f5f5f7] dark:hover:bg-[#2c2c2e]"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="truncate">
              <span className="text-[15px] font-semibold tracking-[-0.02em] text-[#1d1d1f] dark:text-[#f5f5f7]">
                AC-31 Thoubal
              </span>
              <span className="mx-2 text-[#d2d2d7] dark:text-[#38383a] hidden sm:inline">/</span>
              <span className="text-[13px] font-normal text-[#6e6e73] dark:text-[#a1a1a6] hidden sm:inline">
                Voter List Management
              </span>
            </div>
          </div>

          {/* Center: Search Bar with Scope Selection & Instant Dropdown Preview */}
          <div ref={searchContainerRef} className="relative flex-1 max-w-lg lg:max-w-xl">
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6e6e73] dark:text-[#a1a1a6]" />
              <input
                ref={searchInputRef}
                type="text"
                value={globalSearch}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => {
                  setGlobalSearch(e.target.value);
                  setIsSearchOpen(true);
                  if (activeTab !== 'voter-list') {
                    setActiveTab('voter-list');
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsSearchOpen(false);
                    if (activeTab !== 'voter-list') {
                      setActiveTab('voter-list');
                    }
                  }
                }}
                placeholder={
                  searchScope === 'name'
                    ? 'Search voter name (e.g. Thokchom, Joykumar)...'
                    : searchScope === 'houseNo'
                    ? 'Search house number (e.g. 19/2, 42/A)...'
                    : searchScope === 'voterId'
                    ? 'Search voter ID or EPIC (e.g. MNP1042013, vot-0001)...'
                    : 'Search by name, house number, or voter ID...'
                }
                className="w-full h-10 rounded-full border border-[#d2d2d7] dark:border-[#38383a] bg-[#f5f5f7] dark:bg-[#000000] pl-10 pr-24 text-[13px] sm:text-[14px] text-[#1d1d1f] dark:text-[#f5f5f7] placeholder:text-[#6e6e73] dark:placeholder:text-[#a1a1a6] focus:bg-white dark:focus:bg-[#1c1c1e] focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 focus:outline-none transition-all"
              />

              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {globalSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setGlobalSearch('');
                      searchInputRef.current?.focus();
                    }}
                    aria-label="Clear search"
                    className="h-6 w-6 inline-flex items-center justify-center rounded-full text-[#6e6e73] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7] hover:bg-[#d2d2d7]/50 dark:hover:bg-[#38383a]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <kbd
                  onClick={() => {
                    searchInputRef.current?.focus();
                    setIsSearchOpen(true);
                  }}
                  className="hidden sm:inline-flex items-center text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border border-[#d2d2d7] dark:border-[#38383a] bg-white dark:bg-[#1c1c1e] text-[#6e6e73] dark:text-[#a1a1a6] shadow-2xs cursor-pointer select-none"
                  title="Press ⌘K or / to search"
                >
                  ⌘K
                </kbd>
              </div>
            </div>

            {/* Live Search Preview Dropdown Popover */}
            {isSearchOpen && globalSearch.trim().length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 rounded-[20px] border border-[#d2d2d7] dark:border-[#38383a] bg-white dark:bg-[#1c1c1e] shadow-2xl p-3 z-50 text-[13px] backdrop-blur-md space-y-2.5">
                {/* Search Scope Filter Tabs */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d2d2d7]/60 dark:border-[#38383a] pb-2">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-[#6e6e73] dark:text-[#a1a1a6]">
                    <span>Filter by:</span>
                    <div className="inline-flex rounded-full bg-[#f5f5f7] dark:bg-[#000000] p-0.5 border border-[#d2d2d7] dark:border-[#38383a]">
                      {(
                        [
                          { id: 'all', label: 'All' },
                          { id: 'name', label: 'Name' },
                          { id: 'houseNo', label: 'House No' },
                          { id: 'voterId', label: 'Voter ID' },
                        ] as const
                      ).map((scope) => (
                        <button
                          key={scope.id}
                          type="button"
                          onClick={() => setSearchScope(scope.id)}
                          className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                            searchScope === scope.id
                              ? 'bg-[#0071e3] text-white'
                              : 'text-[#6e6e73] dark:text-[#a1a1a6] hover:text-[#1d1d1f] dark:hover:text-white'
                          }`}
                        >
                          {scope.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-[#0071e3] tabular-nums">
                    {matchingVoters.length} {matchingVoters.length === 1 ? 'voter' : 'voters'} found
                  </span>
                </div>

                {/* Results list */}
                {matchingVoters.length === 0 ? (
                  <div className="py-6 text-center text-xs space-y-1.5">
                    <p className="font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">
                      No voters matching &ldquo;{globalSearch}&rdquo; in {searchScope === 'all' ? 'Name, House No, or Voter ID' : searchScope === 'houseNo' ? 'House Number' : searchScope === 'voterId' ? 'Voter ID' : 'Name'}.
                    </p>
                    <p className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6]">
                      Try searching by name (e.g. &ldquo;Thokchom&rdquo;), house number (e.g. &ldquo;19/2&rdquo;), or voter ID (e.g. &ldquo;MNP1042013&rdquo;).
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
                    {matchingVoters.slice(0, 6).map((voter) => {
                      const reason = getMatchReason(voter, globalSearch);
                      const ReasonIcon = reason?.icon || Search;
                      return (
                        <div
                          key={voter.id}
                          onClick={() => handleSelectVoter(voter.id)}
                          className="group flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-[#f5f5f7] dark:hover:bg-[#2c2c2e] cursor-pointer transition-colors border border-transparent hover:border-[#d2d2d7]/50 dark:hover:border-[#38383a]"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] text-[13px] truncate">
                                {voter.name}
                              </span>
                              <span className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6] font-mono">
                                Age {voter.age} · {voter.gender}
                              </span>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                              {/* House No Badge */}
                              <span className="inline-flex items-center gap-1 font-mono text-[11px] font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded-md">
                                <Home className="h-3 w-3" />
                                {voter.houseNo || voter.addressId?.split(',')[0] || 'No House #'}
                              </span>

                              {/* Voter ID Badge */}
                              <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-1.5 py-0.5 rounded-md">
                                <Hash className="h-3 w-3" />
                                {voter.epicNo}
                              </span>

                              {/* Polling station */}
                              <span className="text-[#6e6e73] dark:text-[#a1a1a6] text-[11px]">
                                PS-{voter.partNo}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {reason && reason.type !== 'all' && (
                              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-[#0071e3] bg-[#0071e3]/10 px-2 py-0.5 rounded-full">
                                <ReasonIcon className="h-2.5 w-2.5" />
                                {reason.type === 'houseNo' ? 'House Match' : reason.type === 'voterId' ? 'ID Match' : 'Name Match'}
                              </span>
                            )}
                            <ArrowRight className="h-4 w-4 text-[#a1a1a6] group-hover:text-[#0071e3] transition-colors" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Footer action */}
                {matchingVoters.length > 0 && (
                  <div className="pt-2 border-t border-[#d2d2d7]/60 dark:border-[#38383a] flex items-center justify-between text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSearchOpen(false);
                        if (activeTab !== 'voter-list') {
                          setActiveTab('voter-list');
                        }
                      }}
                      className="inline-flex items-center gap-1 text-[#0071e3] font-semibold hover:underline"
                    >
                      <span>View all {matchingVoters.length} matching voters in Electoral Roll</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                    <span className="hidden sm:inline-flex items-center gap-1 text-[#6e6e73] dark:text-[#a1a1a6]">
                      <CornerDownLeft className="h-3 w-3" />
                      Press Enter
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Light/Dark/System Segmented Toggle, Phone Mask Toggle, Notification Bell, and User Profile Dropdown */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Segmented Light / Dark / System Theme Control */}
            <div
              role="group"
              aria-label="Appearance theme"
              className="hidden sm:inline-flex items-center rounded-full bg-[#f5f5f7] dark:bg-[#000000] border border-[#d2d2d7] dark:border-[#38383a] p-0.5"
            >
              {(
                [
                  { id: 'light', label: 'Light', icon: Sun },
                  { id: 'dark', label: 'Dark', icon: Moon },
                  { id: 'system', label: 'Auto', icon: Monitor },
                ] as const
              ).map((item) => {
                const Icon = item.icon;
                const active = themeMode === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setThemeMode(item.id)}
                    title={`Theme: ${item.label}`}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-medium transition-colors ${
                      active
                        ? 'bg-[#0071e3] text-white'
                        : 'text-[#6e6e73] dark:text-[#a1a1a6] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7]'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden xl:inline">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Mobile Theme Toggle Button */}
            <button
              type="button"
              onClick={cycleThemeMode}
              title={`Appearance: ${themeMode} (${resolvedTheme})`}
              className="sm:hidden inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#d2d2d7] dark:border-[#38383a] bg-white dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-[#f5f5f7]"
            >
              {resolvedTheme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>

            {canUnmaskPhone ? (
              <button
                type="button"
                onClick={() => setRevealFullPhone(!revealFullPhone)}
                title={revealFullPhone ? 'Mask Voter Phone Numbers' : 'Unmask Voter Phone Numbers (Audit Logged)'}
                className={`hidden md:inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors ${
                  revealFullPhone
                    ? 'border-[#0071e3] bg-[#0071e3]/10 text-[#0071e3]'
                    : 'border-[#d2d2d7] dark:border-[#38383a] bg-[#f5f5f7] dark:bg-[#1c1c1e] text-[#6e6e73] dark:text-[#a1a1a6] hover:text-[#1d1d1f]'
                }`}
              >
                {revealFullPhone ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                <span>{revealFullPhone ? 'Phones Visible' : '98XXXXXX21'}</span>
              </button>
            ) : (
              <span
                title={`Phone PII Masked for ${currentUser.role}`}
                className="hidden md:inline-flex h-9 items-center gap-1.5 rounded-full border border-[#d2d2d7] dark:border-[#38383a] bg-[#f5f5f7] dark:bg-[#1c1c1e] px-3 text-[12px] font-mono text-[#6e6e73] dark:text-[#a1a1a6]"
              >
                <Lock className="h-3.5 w-3.5 text-amber-600" />
                <span>PII Masked</span>
              </span>
            )}

            {/* Notification Bell Icon & Dropdown */}
            <div className="relative">
              <button
                type="button"
                aria-label="Notifications"
                onClick={() => {
                  setShowNotifications((v) => !v);
                  setShowUserMenu(false);
                }}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d2d2d7] dark:border-[#38383a] bg-white dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#f5f5f7] dark:hover:bg-[#2c2c2e] transition-colors"
              >
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff3b30] px-1 text-[11px] font-semibold text-white tabular-nums">
                    {notificationCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 rounded-[20px] border border-[#d2d2d7] dark:border-[#38383a] bg-white dark:bg-[#1c1c1e] p-4 shadow-xl space-y-2.5 z-50 text-[13px]">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-900">Notifications & Escalations ({notificationCount})</span>
                    <button
                      type="button"
                      onClick={() => setShowNotifications(false)}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {notificationCount === 0 ? (
                    <p className="py-4 text-center text-slate-500">All tasks and queues are up to date.</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {overdueTasks.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setActiveTab('voter-list');
                            setShowNotifications(false);
                          }}
                          className="w-full text-left rounded-xl bg-red-50/60 border border-red-100 p-2.5 hover:bg-red-50 transition-colors"
                        >
                          <div className="font-semibold text-red-900">Overdue Task: {t.title}</div>
                          <div className="text-[11px] text-red-700 mt-0.5">Due {t.dueDate} · Priority: {t.priority}</div>
                        </button>
                      ))}
                      {pendingExports.map((e) => (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => {
                            setActiveTab('reports');
                            setShowNotifications(false);
                          }}
                          className="w-full text-left rounded-xl bg-amber-50/60 border border-amber-100 p-2.5 hover:bg-amber-50 transition-colors"
                        >
                          <div className="font-semibold text-amber-900">Export Approval Pending ({e.recordCount} rows)</div>
                          <div className="text-[11px] text-amber-700 mt-0.5">Requested by {e.requesterName}</div>
                        </button>
                      ))}
                      {unassignedImports.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            setActiveTab('import-data');
                            setShowNotifications(false);
                          }}
                          className="w-full text-left rounded-xl bg-blue-50/60 border border-blue-100 p-2.5 hover:bg-blue-50 transition-colors"
                        >
                          <div className="font-semibold text-blue-900">Unassigned Import: {u.name} ({u.epicNo})</div>
                          <div className="text-[11px] text-blue-700 mt-0.5">{u.reason}</div>
                        </button>
                      ))}
                      {recentVoterNotifications.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => {
                            setActiveTab('voter-list');
                            setSelectedVoterId(n.voterId);
                            setShowNotifications(false);
                          }}
                          className="w-full text-left rounded-xl bg-emerald-50/60 border border-emerald-100 p-2.5 hover:bg-emerald-50 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-emerald-950 truncate">
                              Notified: {n.voterName}
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-700 shrink-0">
                              {n.channel} · {n.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-emerald-800 mt-0.5 truncate">{n.subject}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                aria-label="User profile menu"
                onClick={() => {
                  setShowUserMenu((v) => !v);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white pl-1.5 pr-3 py-1 hover:bg-slate-50 transition-colors"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#0b192c] text-white text-xs font-bold">
                  {currentUser.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')}
                </span>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold text-slate-900 leading-none">{currentUser.name}</div>
                  <div className="text-[10px] text-[#0071e3] font-medium mt-0.5">{currentUser.role}</div>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1c1c1e] p-3.5 shadow-xl space-y-3 z-50 text-xs">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-2.5">
                    <div className="font-bold text-slate-900 dark:text-slate-100">{currentUser.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono truncate">{currentUser.email}</div>
                    <div className="mt-1.5 flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-[#0071e3]">{currentUser.role}</span>
                      <span className="font-mono text-slate-500 tabular-nums">
                        {currentUser.pollingStationIds.includes('ALL')
                          ? 'PS 1–41'
                          : `${currentUser.pollingStationIds.length} Booths`}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 p-2.5 space-y-1 text-[11px]">
                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                      <span className="font-medium">Session Persistence</span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">Active</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 leading-snug">
                      To switch to another official account, sign out and authenticate with that official&apos;s Email, Password, and 4-Digit PIN.
                    </p>
                  </div>

                  {/* Sign Out / Switch Account Action */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-2 space-y-1.5">
                    {(currentUser.role === 'Super Admin' || currentUser.role === 'Admin/Coordinator') && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('users');
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <UserCog className="h-3.5 w-3.5" />
                        <span>Manage Official Accounts ({users.length})</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthPassword('');
                        setAuthPin('');
                        setShowUserMenu(false);
                        lockSession();
                      }}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 dark:bg-white px-3 py-2 text-xs font-semibold text-white dark:text-slate-900 hover:opacity-90"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out &amp; Switch Account</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Viewport Content */}
        <main key={activeTab} className="apple-reveal flex-1 overflow-y-auto px-4 py-8 lg:px-8 lg:py-10">
          <div className="max-w-[1440px] w-full mx-auto">
            {activeTab === 'voter-list' && <VoterListView />}
            {activeTab === 'family-view' && <FamilyView />}
            {activeTab === 'villages-stations' && <VillagesStationsView />}
            {activeTab === 'maps' && <MapsView />}
            {activeTab === 'import-data' && canAccessTab('import-data') && (
              <>
                {!canImportData && (
                  <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900">
                    <div className="flex items-center gap-2.5">
                      <Shield className="h-5 w-5 text-amber-700 shrink-0" />
                      <div>
                        <div className="font-bold">
                          RBAC Data Guard: Bulk Import & Rollback Restricted ({currentUser.role})
                        </div>
                        <p className="text-[11px] text-amber-800 mt-0.5">
                          Only Super Admin and Admin/Coordinator roles are permitted to commit or roll back bulk electoral roll imports.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('users')}
                      className="rounded-full bg-amber-900 px-3.5 py-1.5 text-[11px] font-semibold text-white hover:bg-amber-800"
                    >
                      View RBAC Permissions
                    </button>
                  </div>
                )}
                <ImportDataView />
              </>
            )}
            {activeTab === 'reports' && <ReportsView />}
            {activeTab === 'users' && canAccessTab('users') && <UsersView />}
            {activeTab === 'settings' && canAccessTab('settings') && <SettingsView />}
          </div>
        </main>
      </div>

      {/* Bottom-Center Toast Notifications */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2.5 w-full max-w-md px-4 pointer-events-none">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center justify-between gap-3 rounded-[20px] border px-5 py-3.5 shadow-lg text-[14px] ${
                t.variant === 'danger'
                  ? 'bg-[#ff3b30] border-[#ff3b30] text-white'
                  : 'bg-[#1d1d1f] dark:bg-[#1c1c1e] border-[#38383a] text-[#f5f5f7]'
              }`}
            >
              <div>
                <div className="font-semibold">{t.title}</div>
                {t.description && <div className="text-[13px] text-[#a1a1a6] mt-0.5">{t.description}</div>}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                className="text-[#a1a1a6] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

