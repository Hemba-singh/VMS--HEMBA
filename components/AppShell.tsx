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
import { useStore, matchesFuzzyQuery } from '@/lib/store-context';
import { NavigationTab, Voter } from '@/lib/types';
import dynamic from 'next/dynamic';
import VoterListView from './VoterListView';

const FamilyView = dynamic(() => import('./FamilyView'), {
  loading: () => <div className="p-8 text-center text-sm text-slate-500 dark:text-zinc-400">Loading family view...</div>,
});
const VillagesStationsView = dynamic(() => import('./VillagesStationsView'), {
  loading: () => <div className="p-8 text-center text-sm text-slate-500 dark:text-zinc-400">Loading villages and polling stations...</div>,
});
const MapsView = dynamic(() => import('./MapsView'), {
  loading: () => <div className="p-8 text-center text-sm text-slate-500 dark:text-zinc-400">Loading constituency map...</div>,
});
const ImportDataView = dynamic(() => import('./ImportDataView'), {
  loading: () => <div className="p-8 text-center text-sm text-slate-500 dark:text-zinc-400">Loading import pipeline...</div>,
});
const ReportsView = dynamic(() => import('./ReportsView'), {
  loading: () => <div className="p-8 text-center text-sm text-slate-500 dark:text-zinc-400">Loading analytics and reports...</div>,
});
const UsersView = dynamic(() => import('./UsersView'), {
  loading: () => <div className="p-8 text-center text-sm text-slate-500 dark:text-zinc-400">Loading user management...</div>,
});
const SettingsView = dynamic(() => import('./SettingsView'), {
  loading: () => <div className="p-8 text-center text-sm text-slate-500 dark:text-zinc-400">Loading settings...</div>,
});

const NAV_ITEMS: { id: NavigationTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'voter-list', label: 'Voter list', icon: Users },
  { id: 'family-view', label: 'Family view', icon: Home },
  { id: 'villages-stations', label: 'Villages & stations', icon: MapPin },
  { id: 'maps', label: 'Maps', icon: MapIcon },
  { id: 'import-data', label: 'Import data', icon: Upload },
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const matchingVoters = useMemo(() => {
    if (!globalSearch.trim()) return [];
    const famMap = new Map(scopedFamilies.map((f) => [f.id, f.familyCode]));
    return voters.filter((v) => matchesFuzzyQuery(v, globalSearch, famMap.get(v.familyId), searchScope));
  }, [voters, globalSearch, scopedFamilies, searchScope]);

  const getMatchReason = (voter: Voter, query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    const house = (voter.houseNo || '').toLowerCase();
    const epic = (voter.epicNo || '').toLowerCase();
    const vId = (voter.id || '').toLowerCase();
    const name = (voter.name || '').toLowerCase();

    if (house.includes(q) || (voter.addressId && voter.addressId.toLowerCase().includes(q))) {
      return { type: 'houseNo', label: `House no: ${voter.houseNo || voter.addressId.split(',')[0]}`, icon: Home };
    }
    if (epic.includes(q) || vId.includes(q) || String(voter.serialNo) === q) {
      return { type: 'voterId', label: `Voter ID: ${voter.epicNo}`, icon: Hash };
    }
    if (name.includes(q)) {
      return { type: 'name', label: `Name match: ${voter.name}`, icon: User };
    }
    return { type: 'all', label: 'Electoral record', icon: Search };
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

  const getNavCount = (id: NavigationTab): string | number | null => {
    if (id === 'voter-list') return voters.length;
    if (id === 'family-view') return scopedFamilies.length;
    if (id === 'villages-stations') return scopedPollingStations.length;
    if (id === 'import-data' && unassignedImports.length > 0) return unassignedImports.length;
    if (id === 'users') return users.length;
    return null;
  };

  const activeNavLabel = NAV_ITEMS.find((item) => item.id === activeTab)?.label || 'Voter list';

  if (!isAuthHydrated) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 gap-3">
        <Shield className="h-6 w-6 text-blue-600 dark:text-blue-500" />
        <div className="text-xs font-medium text-slate-500 dark:text-zinc-400">
          Restoring session...
        </div>
      </div>
    );
  }

  if (!isAuthenticated || isSessionLocked || !currentUser?.active) {
    return (
      <div className="min-h-screen w-full flex flex-col justify-between bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">
        {/* Clean Minimal Top Bar */}
        <header className="w-full max-w-5xl mx-auto px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-500 shrink-0" />
            <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-zinc-100 whitespace-nowrap">
              AC-31 Thoubal
            </span>
          </div>

          <button
            type="button"
            onClick={cycleThemeMode}
            title={`Theme: ${themeMode}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0"
          >
            {resolvedTheme === 'dark' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
            <span className="capitalize">{themeMode}</span>
          </button>
        </header>

        {/* Center Authentication Grid */}
        <main className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Plain Architectural Context */}
            <div className="lg:col-span-5 space-y-6 text-left">
              <div className="space-y-3">
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  Manipur Legislative Assembly · Constituency 31
                </p>
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-zinc-50 leading-tight max-w-sm">
                  Sign in to access AC-31 Thoubal voter records
                </h1>
                <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Electoral roll management, household verification, and booth records across 41 polling stations.
                </p>
              </div>

              <div className="border-t border-slate-200 dark:border-zinc-800 pt-5 space-y-3 text-xs text-slate-600 dark:text-zinc-400">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-zinc-200">Station isolation.</span>{' '}
                  Officials see only voters, families, and booths assigned to their role.
                </div>
                <div>
                  <span className="font-semibold text-slate-900 dark:text-zinc-200">Phone privacy.</span>{' '}
                  Phone numbers stay masked by default, and unmasking writes to the audit log.
                </div>
              </div>
            </div>

            {/* Right Column: Clean Login Card */}
            <div className="lg:col-span-7">
              <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 space-y-5">
                <div className="border-b border-slate-200 dark:border-zinc-800 pb-4">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
                    Official sign in
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                    Enter your registered email, password, and security PIN.
                  </p>
                </div>

                {authError && (
                  <div
                    role="alert"
                    className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-3.5 py-2.5 flex items-start gap-2.5 text-red-700 dark:text-red-300"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                    <div className="space-y-0.5 text-xs">
                      <div className="font-semibold">Authentication failed</div>
                      <p className="text-[11px] leading-relaxed">{authError.message}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleAuthGateSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                      Official email address
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
                      placeholder="name@example.com"
                      className={`w-full rounded-lg border ${
                        authError?.field === 'email' || authError?.field === 'account'
                          ? 'border-red-500 focus:border-red-600'
                          : 'border-slate-200 dark:border-zinc-700 focus:border-blue-600'
                      } bg-slate-50 dark:bg-zinc-950 px-3.5 py-2.5 font-mono text-slate-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none transition-colors`}
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                      Password
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="current-password"
                        value={authPassword}
                        onChange={(e) => {
                          setAuthPassword(e.target.value);
                          if (authError) clearAuthError();
                        }}
                        placeholder="Enter password"
                        className={`w-full rounded-lg border ${
                          authError?.field === 'password'
                            ? 'border-red-500 focus:border-red-600'
                            : 'border-slate-200 dark:border-zinc-700 focus:border-blue-600'
                        } bg-slate-50 dark:bg-zinc-950 pl-9 pr-14 py-2.5 font-mono text-slate-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none transition-colors`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 text-[11px] font-medium text-slate-500 hover:text-slate-900 dark:hover:text-zinc-200"
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                      Security PIN
                    </label>
                    <div className="relative flex items-center">
                      <KeyRound className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
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
                        placeholder="4-digit PIN"
                        className={`w-full rounded-lg border ${
                          authError?.field === 'pin'
                            ? 'border-red-500 focus:border-red-600'
                            : 'border-slate-200 dark:border-zinc-700 focus:border-blue-600'
                        } bg-slate-50 dark:bg-zinc-950 pl-9 pr-14 py-2.5 font-mono tabular-nums tracking-widest text-slate-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none transition-colors`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin((prev) => !prev)}
                        className="absolute right-3 text-[11px] font-medium text-slate-500 hover:text-slate-900 dark:hover:text-zinc-200"
                      >
                        {showPin ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-lg bg-slate-900 dark:bg-white py-2.5 px-4 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-slate-800 dark:hover:bg-zinc-100 transition-colors"
                  >
                    Sign in
                  </button>
                </form>

                <div className="border-t border-slate-200 dark:border-zinc-800 pt-3.5 text-[11px] text-slate-500 dark:text-zinc-400">
                  Sessions stay active across refreshes until you sign out.
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Quiet Footer */}
        <footer className="w-full max-w-5xl mx-auto px-6 py-4 border-t border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-zinc-500">
          <span>AC-31 Thoubal Voter List Management System</span>
          <span className="font-mono tabular-nums">41 polling stations</span>
        </footer>

        {toasts.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-md px-4 pointer-events-none">
            {toasts.map((t) => (
              <div
                key={t.id}
                className={`pointer-events-auto flex items-center justify-between gap-3 rounded-xl border px-4 py-3 shadow-lg text-xs ${
                  t.variant === 'danger'
                    ? 'bg-red-600 border-red-600 text-white'
                    : 'bg-slate-900 dark:bg-zinc-900 border-slate-800 dark:border-zinc-700 text-white'
                }`}
              >
                <div>
                  <div className="font-semibold">{t.title}</div>
                  {t.description && <div className="text-[11px] opacity-80 mt-0.5">{t.description}</div>}
                </div>
                <button type="button" onClick={() => dismissToast(t.id)} className="opacity-70 hover:opacity-100">
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
    <div className="h-screen overflow-hidden flex bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors">
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[1px] lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Clean Minimal Left Sidebar (240px) */}
      <aside
        aria-label="Primary Sidebar Navigation"
        className={`fixed inset-y-0 left-0 z-40 h-full ${
          isSidebarCollapsed ? 'lg:w-16 w-60' : 'w-60'
        } bg-white dark:bg-zinc-950 border-r border-slate-200 dark:border-zinc-800 flex flex-col justify-between transition-all duration-150 lg:translate-x-0 lg:static lg:shrink-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Sidebar Brand Header */}
          <div className="h-14 px-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-2 shrink-0">
            {!isSidebarCollapsed ? (
              <div className="flex items-center gap-2 min-w-0">
                <Shield className="h-4 w-4 text-blue-600 dark:text-blue-500 shrink-0" />
                <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-zinc-100 truncate">
                  AC-31 Thoubal
                </span>
              </div>
            ) : (
              <Shield className="h-4 w-4 text-blue-600 dark:text-blue-500 mx-auto" />
            )}
            <button
              type="button"
              onClick={toggleSidebarCollapsed}
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden lg:inline-flex text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800"
            >
              {isSidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close navigation menu"
              className="lg:hidden text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Sidebar Navigation Links */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {NAV_ITEMS.filter((item) => canAccessTab(item.id)).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const count = getNavCount(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  title={item.label}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full min-h-[38px] flex items-center ${
                    isSidebarCollapsed ? 'lg:justify-center' : 'justify-between'
                  } gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-100 dark:bg-zinc-800/90 text-slate-900 dark:text-zinc-50 font-semibold'
                      : 'text-slate-600 dark:text-zinc-400 font-medium hover:bg-slate-50 dark:hover:bg-zinc-900 hover:text-slate-900 dark:hover:text-zinc-100'
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-zinc-500'
                      }`}
                    />
                    <span className={`truncate ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
                  </span>
                  {count !== null && (
                    <span
                      className={`text-[11px] font-mono tabular-nums text-slate-400 dark:text-zinc-500 shrink-0 ${
                        isSidebarCollapsed ? 'lg:hidden' : ''
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Bottom Role Scope (Flat, hairline divided — no nested card) */}
        <div className="p-3.5 border-t border-slate-200 dark:border-zinc-800 space-y-2 text-xs shrink-0">
          {!isSidebarCollapsed ? (
            <div className="space-y-2">
              <div className="space-y-0.5">
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">Active scope</div>
                <div className="font-semibold text-slate-900 dark:text-zinc-100 truncate">{currentUser.role}</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono truncate">
                  {currentUser.pollingStationIds.includes('ALL')
                    ? 'All 41 stations'
                    : currentUser.pollingStationIds.map((p) => p.toUpperCase()).join(', ')}
                </div>
              </div>
              <button
                type="button"
                onClick={lockSession}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 py-1.5 px-3 text-xs font-medium text-slate-700 dark:text-zinc-300 transition-colors whitespace-nowrap"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign out</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={lockSession}
              className="w-full flex justify-center p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800"
              title={`${currentUser.role} — Sign out`}
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header (56px height, clean hairline border, 3 zones) */}
        <header className="shrink-0 relative z-30 h-14 bg-white/90 dark:bg-zinc-950/90 backdrop-blur border-b border-slate-200 dark:border-zinc-800 px-4 lg:px-6 flex items-center justify-between gap-6">
          {/* Zone 1: Contextual Breadcrumb */}
          <div className="flex items-center gap-2.5 min-w-0 shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden h-9 w-9 inline-flex items-center justify-center rounded-lg text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-xs sm:text-[13px] whitespace-nowrap">
              <span className="font-semibold text-slate-900 dark:text-zinc-100 hidden sm:inline">AC-31 Thoubal</span>
              <span className="text-slate-300 dark:text-zinc-700 hidden sm:inline">/</span>
              <span className="font-medium text-slate-600 dark:text-zinc-300">{activeNavLabel}</span>
            </div>
          </div>

          {/* Zone 2: Clean Search Input */}
          <div ref={searchContainerRef} className="relative flex-1 max-w-md lg:max-w-lg">
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500" />
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
                    ? 'Search voter name...'
                    : searchScope === 'houseNo'
                    ? 'Search house number...'
                    : searchScope === 'voterId'
                    ? 'Search voter ID or EPIC...'
                    : 'Search name, house number, or EPIC...'
                }
                className="w-full h-9 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 pl-9 pr-16 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:bg-white dark:focus:bg-zinc-950 focus:border-blue-600 focus:outline-none transition-colors"
              />

              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {globalSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setGlobalSearch('');
                      searchInputRef.current?.focus();
                    }}
                    aria-label="Clear search"
                    className="h-6 w-6 inline-flex items-center justify-center rounded text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <kbd
                  onClick={() => {
                    searchInputRef.current?.focus();
                    setIsSearchOpen(true);
                  }}
                  className="hidden sm:inline-flex items-center text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 cursor-pointer select-none"
                  title="Press Cmd+K or / to search"
                >
                  ⌘K
                </kbd>
              </div>
            </div>

            {isSearchOpen && globalSearch.trim().length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl p-3 z-50 text-xs space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-800 pb-2">
                  <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                    <span>Scope:</span>
                    <div className="inline-flex rounded-lg bg-slate-100 dark:bg-zinc-800 p-0.5">
                      {(
                        [
                          { id: 'all', label: 'All' },
                          { id: 'name', label: 'Name' },
                          { id: 'houseNo', label: 'House no' },
                          { id: 'voterId', label: 'EPIC' },
                        ] as const
                      ).map((scope) => (
                        <button
                          key={scope.id}
                          type="button"
                          onClick={() => setSearchScope(scope.id)}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                            searchScope === scope.id
                              ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-2xs'
                              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
                          }`}
                        >
                          {scope.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 tabular-nums">
                    {matchingVoters.length} found
                  </span>
                </div>

                {matchingVoters.length === 0 ? (
                  <div className="py-5 text-center text-xs space-y-1">
                    <p className="font-medium text-slate-900 dark:text-zinc-100">
                      No voters matching &quot;{globalSearch}&quot;
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Search by voter name, house number, or EPIC number.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-72 overflow-y-auto">
                    {matchingVoters.slice(0, 6).map((voter) => {
                      const reason = getMatchReason(voter, globalSearch);
                      const ReasonIcon = reason?.icon || Search;
                      return (
                        <div
                          key={voter.id}
                          onClick={() => handleSelectVoter(voter.id)}
                          className="group flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900 dark:text-zinc-100 truncate">
                                {voter.name}
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono tabular-nums">
                                {Number.isFinite(voter.age) ? voter.age : '-'} {voter.gender}
                              </span>
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                              <span>{voter.epicNo}</span>
                              <span>·</span>
                              <span>{voter.houseNo || voter.addressId?.split(',')[0] || 'No house no'}</span>
                              <span>·</span>
                              <span>PS-{Number.isFinite(voter.partNo) ? voter.partNo : '-'}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 text-[11px] text-slate-400">
                            {reason && reason.type !== 'all' && (
                              <span className="hidden sm:inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                                <ReasonIcon className="h-3 w-3" />
                                {reason.type === 'houseNo' ? 'House' : reason.type === 'voterId' ? 'EPIC' : 'Name'}
                              </span>
                            )}
                            <ArrowRight className="h-3.5 w-3.5 group-hover:text-blue-600 transition-colors" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {matchingVoters.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSearchOpen(false);
                        if (activeTab !== 'voter-list') {
                          setActiveTab('voter-list');
                        }
                      }}
                      className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium hover:underline"
                    >
                      <span>View all {matchingVoters.length} matching voters</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                    <span className="hidden sm:inline-flex items-center gap-1 text-slate-400">
                      <CornerDownLeft className="h-3 w-3" />
                      Enter
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Zone 3: Theme, PII Masking, Notifications, Profile */}
          <div className="flex items-center gap-2 shrink-0">
            <div
              role="group"
              aria-label="Appearance theme"
              className="hidden sm:inline-flex items-center rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-0.5"
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
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-2xs'
                        : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden xl:inline">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={cycleThemeMode}
              title={`Appearance: ${themeMode}`}
              className="sm:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200"
            >
              {resolvedTheme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>

            {canUnmaskPhone && (
              <button
                type="button"
                onClick={() => setRevealFullPhone(!revealFullPhone)}
                title={revealFullPhone ? 'Mask voter phone numbers' : 'Unmask voter phone numbers (audit logged)'}
                className={`hidden md:inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  revealFullPhone
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                    : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
                }`}
              >
                {revealFullPhone ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                <span>{revealFullPhone ? 'Phones visible' : 'Masked'}</span>
              </button>
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
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <Bell className="h-4 w-4" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white tabular-nums">
                    {notificationCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-1.5 w-80 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-xl space-y-2.5 z-50 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2">
                    <span className="font-semibold text-slate-900 dark:text-zinc-100">
                      Notifications ({notificationCount})
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowNotifications(false)}
                      className="text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {notificationCount === 0 ? (
                    <p className="py-4 text-center text-slate-500 dark:text-zinc-400">
                      All tasks and queues are up to date.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-64 overflow-y-auto">
                      {overdueTasks.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setActiveTab('voter-list');
                            setShowNotifications(false);
                          }}
                          className="w-full text-left rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/60 dark:bg-red-950/30 p-2.5 hover:bg-red-50 transition-colors"
                        >
                          <div className="font-semibold text-red-900 dark:text-red-200">Overdue task: {t.title}</div>
                          <div className="text-[11px] text-red-700 dark:text-red-400 mt-0.5">
                            Due {t.dueDate} · Priority: {t.priority}
                          </div>
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
                          className="w-full text-left rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/30 p-2.5 hover:bg-amber-50 transition-colors"
                        >
                          <div className="font-semibold text-amber-900 dark:text-amber-200">
                            Export pending ({e.recordCount} rows)
                          </div>
                          <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                            Requested by {e.requesterName}
                          </div>
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
                          className="w-full text-left rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50/60 dark:bg-blue-950/30 p-2.5 hover:bg-blue-50 transition-colors"
                        >
                          <div className="font-semibold text-blue-900 dark:text-blue-200">
                            Unassigned import: {u.name} ({u.epicNo})
                          </div>
                          <div className="text-[11px] text-blue-700 dark:text-blue-400 mt-0.5">{u.reason}</div>
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
                          className="w-full text-left rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-2.5 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-900 dark:text-zinc-100 truncate">
                              Notified: {n.voterName}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-zinc-400 shrink-0">
                              {n.channel} · {n.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 dark:text-zinc-400 mt-0.5 truncate">{n.subject}</div>
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
                className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[11px] font-semibold shrink-0">
                  {currentUser.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')}
                </span>
                <span className="text-xs font-medium text-slate-900 dark:text-zinc-100 hidden sm:inline">
                  {currentUser.name}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-1.5 w-72 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-xl space-y-3 z-50 text-xs">
                  <div className="border-b border-slate-100 dark:border-zinc-800 pb-3 space-y-1">
                    <div className="font-semibold text-slate-900 dark:text-zinc-100">{currentUser.name}</div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono truncate">
                      {currentUser.email}
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1 text-slate-600 dark:text-zinc-300">
                      <span className="font-medium text-blue-600 dark:text-blue-400">{currentUser.role}</span>
                      <span className="font-mono tabular-nums">
                        {currentUser.pollingStationIds.includes('ALL')
                          ? 'PS 1-41'
                          : `${currentUser.pollingStationIds.length} booths`}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                    Sign out and re-authenticate with another official account to change users.
                  </p>

                  <div className="border-t border-slate-100 dark:border-zinc-800 pt-2.5 space-y-2">
                    {canAccessTab('users') && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('users');
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800"
                      >
                        <UserCog className="h-3.5 w-3.5" />
                        <span>Manage accounts ({users.length})</span>
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
                      className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 dark:bg-white px-3 py-2 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-slate-800 dark:hover:bg-zinc-100"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Viewport Content */}
        <main key={activeTab} className="apple-reveal flex-1 overflow-y-auto px-4 py-6 lg:px-8 lg:py-8">
          <div className="max-w-[1440px] w-full mx-auto">
            {activeTab === 'voter-list' && <VoterListView />}
            {activeTab === 'family-view' && <FamilyView />}
            {activeTab === 'villages-stations' && <VillagesStationsView />}
            {activeTab === 'maps' && <MapsView />}
            {activeTab === 'import-data' && canAccessTab('import-data') && (
              <>
                {!canImportData && (
                  <div className="mb-6 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
                    <div>
                      <div className="font-semibold">
                        Import restricted for {currentUser.role}
                      </div>
                      <p className="text-[11px] opacity-85 mt-0.5">
                        Only Super Admin and Admin/Coordinator roles can commit or roll back electoral roll imports.
                      </p>
                    </div>
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-md px-4 pointer-events-none">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center justify-between gap-3 rounded-xl border px-4 py-3 shadow-lg text-xs ${
                t.variant === 'danger'
                  ? 'bg-red-600 border-red-600 text-white'
                  : 'bg-slate-900 dark:bg-zinc-900 border-slate-800 dark:border-zinc-700 text-white'
              }`}
            >
              <div>
                <div className="font-semibold">{t.title}</div>
                {t.description && <div className="text-[11px] opacity-80 mt-0.5">{t.description}</div>}
              </div>
              <button type="button" onClick={() => dismissToast(t.id)} className="opacity-70 hover:opacity-100">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
