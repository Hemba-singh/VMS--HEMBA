'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Voter,
  Family,
  Village,
  VillagePart,
  PollingStation,
  VoterTask,
  VoterNote,
  VoterVisit,
  AppUser,
  ImportBatch,
  AuditLog,
  ExportRequest,
  UnassignedImportRecord,
  SavedFilter,
  VoterStatus,
  VoterCategory,
  VoterColorState,
  IssueType,
  NavigationTab,
  VoterNotification,
  NotificationChannel,
  NotificationTemplateType,
} from './types';
import { normalizeVoterCategory, categoryToColorStateLabel } from './utils';
import { generateSeedData, SeedDatabase } from './seed-data';
import {
  db,
  auth,
  isFirebaseConfigured,
  testFirestoreConnection,
  signInWithGoogle,
  signOutFirebase,
  handleFirestoreError,
  OperationType,
} from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore';

export type SearchScope = 'all' | 'name' | 'houseNo' | 'voterId';

// Spelling variant normalization for Manipuri names & common titles
export function normalizeForFuzzySearch(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/thokchon/g, 'thokchom')
    .replace(/konjengban/g, 'konjengbam')
    .replace(/yumnan/g, 'yumnam')
    .replace(/laisram/g, 'laishram')
    .replace(/keisam/g, 'keisham')
    .replace(/singh\b/g, 'sing')
    .replace(/debi\b/g, 'devi')
    .replace(/meetei/g, 'meitei')
    .replace(/phoudel/g, 'foudel')
    .replace(/[^a-z0-9\s]/g, '');
}

export function matchesFuzzyQuery(
  voter: Voter,
  query: string,
  familyCode?: string,
  scope: SearchScope = 'all'
): boolean {
  const cleanQ = query.trim();
  if (!cleanQ) return true;

  const lowerQ = cleanQ.toLowerCase();
  const rawHouseNo = (voter.houseNo || '').toLowerCase();
  const rawEpicNo = (voter.epicNo || '').toLowerCase();
  const rawVoterId = (voter.id || '').toLowerCase();
  const rawName = (voter.name || '').toLowerCase();
  const rawNameLocal = (voter.nameLocal || '').toLowerCase();
  const rawAddress = (voter.addressId || '').toLowerCase();

  // 1. Scope: 'name' -> Filter strictly by voter name, local name, or parent/spouse names
  if (scope === 'name') {
    if (rawName.includes(lowerQ) || rawNameLocal.includes(lowerQ)) return true;
    const normQ = normalizeForFuzzySearch(cleanQ);
    const searchable = normalizeForFuzzySearch(
      [voter.name, voter.nameLocal || '', voter.fatherName || '', voter.motherName || '', voter.spouseName || ''].join(' ')
    );
    return normQ.split(/\s+/).filter(Boolean).every((t) => searchable.includes(t));
  }

  // 2. Scope: 'houseNo' -> Filter strictly by house number or address
  if (scope === 'houseNo') {
    if (rawHouseNo.includes(lowerQ) || rawAddress.includes(lowerQ)) return true;
    const cleanHouse = rawHouseNo.replace(/[^a-z0-9]/g, '');
    const cleanAddress = rawAddress.replace(/[^a-z0-9]/g, '');
    const cleanQuery = lowerQ.replace(/[^a-z0-9]/g, '');
    if (cleanQuery && (cleanHouse.includes(cleanQuery) || cleanAddress.includes(cleanQuery))) {
      return true;
    }
    return false;
  }

  // 3. Scope: 'voterId' -> Filter strictly by Voter ID (EPIC number or system ID or roll serial number)
  if (scope === 'voterId') {
    if (rawEpicNo.includes(lowerQ) || rawVoterId.includes(lowerQ) || String(voter.serialNo) === lowerQ) {
      return true;
    }
    const cleanEpic = rawEpicNo.replace(/[^a-z0-9]/g, '');
    const cleanId = rawVoterId.replace(/[^a-z0-9]/g, '');
    const cleanQuery = lowerQ.replace(/[^a-z0-9]/g, '');
    if (cleanQuery && (cleanEpic.includes(cleanQuery) || cleanId.includes(cleanQuery))) {
      return true;
    }
    return false;
  }

  // 4. Scope: 'all' -> Fast check for direct match on Name, House Number, or Voter ID
  if (
    rawName.includes(lowerQ) ||
    rawNameLocal.includes(lowerQ) ||
    rawHouseNo.includes(lowerQ) ||
    rawEpicNo.includes(lowerQ) ||
    rawVoterId.includes(lowerQ) ||
    rawAddress.includes(lowerQ) ||
    String(voter.serialNo) === lowerQ
  ) {
    return true;
  }

  // Also check without punctuation for house numbers (e.g. 19/2 vs 192 or H.No. 19/2)
  const cleanHouse = rawHouseNo.replace(/[^a-z0-9]/g, '');
  const cleanAddress = rawAddress.replace(/[^a-z0-9]/g, '');
  const cleanEpic = rawEpicNo.replace(/[^a-z0-9]/g, '');
  const cleanId = rawVoterId.replace(/[^a-z0-9]/g, '');
  const cleanQuery = lowerQ.replace(/[^a-z0-9]/g, '');
  if (
    cleanQuery &&
    (cleanHouse.includes(cleanQuery) ||
      cleanAddress.includes(cleanQuery) ||
      cleanEpic.includes(cleanQuery) ||
      cleanId.includes(cleanQuery))
  ) {
    return true;
  }

  // Multi-token normalized fuzzy search across all fields (handles Manipuri spelling variants)
  const normQuery = normalizeForFuzzySearch(cleanQ);
  const tokens = normQuery.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  const searchable = normalizeForFuzzySearch(
    [
      voter.name,
      voter.nameLocal || '',
      voter.epicNo,
      voter.id,
      voter.houseNo || '',
      voter.fatherName || '',
      voter.motherName || '',
      voter.spouseName || '',
      voter.familyId,
      familyCode || '',
      voter.phone || '',
      voter.addressId || '',
    ].join(' ')
  );

  return tokens.every((tok) => searchable.includes(tok));
}

export function maskPhoneNumber(phone: string, canViewFull: boolean): string {
  if (!phone) return '—';
  if (canViewFull) return phone;
  if (phone.length >= 10) {
    return `${phone.slice(0, 2)}XXXXXX${phone.slice(-2)}`;
  }
  return 'XXXXXXXXXX';
}

export function buildVoterNotificationTemplate(
  voter: Voter,
  templateType: NotificationTemplateType,
  psName?: string
): { subject: string; message: string } {
  const boothLabel = psName ? `PS-${voter.partNo} (${psName})` : `PS-${voter.partNo}`;
  switch (templateType) {
    case 'Polling Slip':
      return {
        subject: `Digital Voter Slip · ${voter.epicNo}`,
        message: `Hello ${voter.name}, your AC-31 Thoubal Electoral Roll details: EPIC No: ${voter.epicNo}, Part No: ${voter.partNo}, Serial No: ${voter.serialNo}, Polling Station: ${boothLabel}. Please carry your EPIC ID on polling day.`,
      };
    case 'Verification Reminder':
      return {
        subject: `Household Roll Verification · ${voter.epicNo}`,
        message: `Dear ${voter.name}, our booth verification worker will visit your household (${voter.addressId}) for AC-31 Thoubal roll verification of EPIC ${voter.epicNo} (Part ${voter.partNo}, Sl. ${voter.serialNo}).`,
      };
    case 'Booth Update':
      return {
        subject: `Polling Station Update · PS-${voter.partNo}`,
        message: `Notice for ${voter.name} (EPIC: ${voter.epicNo}): Your designated polling station for AC-31 Thoubal is ${boothLabel}, Serial No: ${voter.serialNo}.`,
      };
    case 'Custom Message':
    default:
      return {
        subject: `Official Notice · ${voter.epicNo}`,
        message: `Dear ${voter.name} (EPIC: ${voter.epicNo}, PS-${voter.partNo}, Sl. ${voter.serialNo}), `,
      };
  }
}

interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'danger' | 'warning';
}

export interface AuthStateObject {
  user: AppUser;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isAuthReady: boolean;
  role: AppUser['role'];
  pollingStationScope: string[];
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface StoreContextValue {
  // Theme (Light / Dark / System default per Apple Design Language)
  themeMode: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setThemeMode: (mode: ThemeMode) => void;
  cycleThemeMode: () => void;

  // Navigation & AppShell UI Toggles
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  activeNavItem: NavigationTab;
  setActiveNavItem: (tab: NavigationTab) => void;
  globalSearch: string;
  setGlobalSearch: (q: string) => void;
  searchScope: SearchScope;
  setSearchScope: (scope: SearchScope) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSidebarCollapsed: () => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleMobileMenu: () => void;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleNotifications: () => void;
  isUserMenuOpen: boolean;
  setIsUserMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleUserMenu: () => void;
  closeHeaderMenus: () => void;
  selectedVoterId: string | null;
  setSelectedVoterId: (id: string | null) => void;
  activeNotifyVoterId: string | null;
  setActiveNotifyVoterId: (id: string | null) => void;
  selectedFamilyFilter: string | null;
  setSelectedFamilyFilter: (familyId: string | null) => void;
  statusCardFilter: VoterStatus | 'ALL';
  setStatusCardFilter: (status: VoterStatus | 'ALL') => void;
  selectedPollingStationFilter: string[]; // empty means all in scope
  setSelectedPollingStationFilter: (psIds: string[]) => void;

  // Auth & Role-Based Access Control (RBAC)
  authState: AuthStateObject;
  currentUser: AppUser;
  switchActiveUserRole: (userId: string) => void;
  isSessionLocked: boolean;
  setIsSessionLocked: (locked: boolean) => void;
  lockSession: () => void;
  authenticateWithRoleCredentials: (email: string, pin: string) => boolean;
  firebaseUser: FirebaseUser | null;
  isAuthReady: boolean;
  isAuthenticated: boolean;
  isConnectedToFirestore: boolean;
  isSyncingFirestore: boolean;
  syncSeedDataToFirestore: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logoutFirebase: () => Promise<void>;
  revealFullPhone: boolean;
  setRevealFullPhone: (val: boolean) => void;
  canEditVoter: boolean;
  canApproveExport: boolean;
  canRequestExport: boolean;
  canImportData: boolean;
  canManageUsers: boolean;
  canDeleteVoter: boolean;
  canRestoreVoter: boolean;
  canUnmaskPhone: boolean;

  // Core Scoped & Full Datasets
  villages: Village[];
  villageParts: VillagePart[];
  pollingStations: PollingStation[];
  scopedPollingStations: PollingStation[];
  voters: Voter[]; // Active, non-deleted, scoped by user role & polling stations
  allVotersIncludingDeleted: Voter[];
  families: Family[];
  scopedFamilies: Family[];
  tasks: VoterTask[];
  notes: VoterNote[];
  visits: VoterVisit[];
  voterNotifications: VoterNotification[];
  users: AppUser[];
  importBatches: ImportBatch[];
  auditLogs: AuditLog[];
  exportRequests: ExportRequest[];
  unassignedImports: UnassignedImportRecord[];
  savedFilters: SavedFilter[];
  availableTags: string[];
  issueTypes: IssueType[];

  // Actions
  sendVoterNotification: (params: {
    voterId: string;
    channel: NotificationChannel;
    templateType: NotificationTemplateType;
    subject: string;
    message: string;
  }) => VoterNotification | null;
  sendBulkVoterNotifications: (params: {
    voterIds: string[];
    channel: NotificationChannel;
    templateType: NotificationTemplateType;
    customMessage?: string;
  }) => void;
  updateVoter: (voterId: string, changes: Partial<Voter>, reasonOrNote?: string) => void;
  createVoter: (
    newVoter: Omit<Voter, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'isDeleted' | 'category'> & {
      category?: VoterCategory;
    }
  ) => Voter;
  softDeleteVoter: (voterId: string, reason: string) => void;
  restoreVoter: (voterId: string) => void;
  bulkUpdateVoters: (
    voterIds: string[],
    action: {
      status?: VoterStatus;
      category?: VoterCategory;
      colorState?: VoterColorState;
      assignedWorkerId?: string;
      addTag?: string;
      moveToPollingStationId?: string;
      moveReason?: string;
    }
  ) => void;
  addNote: (voterId: string, content: string) => void;
  addTask: (task: Omit<VoterTask, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => void;
  updateTaskStatus: (taskId: string, status: VoterTask['status']) => void;
  addVisit: (voterId: string, outcome: string, lat?: number, lng?: number) => void;

  // Family Actions
  moveVoterToFamily: (voterId: string, targetFamilyId: string, reason: string) => void;
  splitFamily: (sourceFamilyId: string, voterIdsToSplit: string[], newHeadVoterId: string, reason: string) => void;
  mergeFamilies: (sourceFamilyId: string, targetFamilyId: string, reason: string) => void;

  // Master Data & Settings Actions
  updatePartStationMapping: (villagePartId: string, newPollingStationId: string, reason: string) => void;
  updatePollingStationWorkers: (psId: string, inchargeId: string, workerIds: string[]) => void;
  addCustomTag: (tag: string) => void;
  saveCustomFilter: (filter: Omit<SavedFilter, 'id'>) => void;

  // Import & Export Actions
  commitImportBatch: (
    fileName: string,
    newVoters: (Omit<Voter, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'isDeleted' | 'importBatchId' | 'category'> & {
      category?: VoterCategory;
    })[],
    unassigned: Omit<UnassignedImportRecord, 'id' | 'batchId'>[],
    errorCount: number
  ) => string;
  rollbackImportBatch: (batchId: string) => void;
  allocateUnassignedRecord: (recordId: string, villagePartId: string) => void;
  requestDataExport: (scopeDescription: string, recordCount: number, reason: string) => void;
  approveOrRejectExport: (requestId: string, decision: 'Approved' | 'Rejected') => void;

  // User Management
  createUser: (user: Omit<AppUser, 'id' | 'uid' | 'createdAt' | 'updatedAt' | 'createdBy'>) => void;
  toggleUserActive: (userId: string) => void;
  updateUserRoleScope: (
    userId: string,
    updates: { role: AppUser['role']; pollingStationIds: string[]; villageIds: string[] }
  ) => void;

  // Toasts
  toasts: ToastMessage[];
  addToast: (title: string, description?: string, variant?: ToastMessage['variant']) => void;
  dismissToast: (id: string) => void;
}

export const StoreContext = createContext<StoreContextValue | null>(null);

export const ROLE_DEFAULT_PINS: Record<AppUser['role'], string> = {
  'Super Admin': '3100',
  'Admin/Coordinator': '3101',
  'Polling Station Incharge': '3102',
  'Field Worker': '3103',
  Viewer: '3104',
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const initialSeed = useMemo(() => generateSeedData(), []);

  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('ac31-apple-theme') as ThemeMode | null;
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    }
    return 'system';
  });
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const isDark = themeMode === 'dark' || (themeMode === 'system' && media.matches);
      setResolvedTheme(isDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', isDark);
    };
    applyTheme();
    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [themeMode]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('ac31-apple-theme', mode);
    }
  }, []);

  const cycleThemeMode = useCallback(() => {
    setThemeModeState((prev) => {
      const next: ThemeMode = prev === 'light' ? 'dark' : prev === 'dark' ? 'system' : 'light';
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('ac31-apple-theme', next);
      }
      return next;
    });
  }, []);

  const [activeTab, setActiveTab] = useState<NavigationTab>('voter-list');
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchScope, setSearchScope] = useState<SearchScope>('all');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const [selectedVoterId, setSelectedVoterId] = useState<string | null>(null);
  const [activeNotifyVoterId, setActiveNotifyVoterId] = useState<string | null>(null);
  const [selectedFamilyFilter, setSelectedFamilyFilter] = useState<string | null>(null);
  const [statusCardFilter, setStatusCardFilter] = useState<VoterStatus | 'ALL'>('ALL');
  const [selectedPollingStationFilter, setSelectedPollingStationFilter] = useState<string[]>([]);

  const toggleSidebarCollapsed = useCallback(() => {
    setIsSidebarCollapsed((prev) => !prev);
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  const toggleNotifications = useCallback(() => {
    setIsNotificationsOpen((prev) => !prev);
    setIsUserMenuOpen(false);
  }, []);

  const toggleUserMenu = useCallback(() => {
    setIsUserMenuOpen((prev) => !prev);
    setIsNotificationsOpen(false);
  }, []);

  const closeHeaderMenus = useCallback(() => {
    setIsNotificationsOpen(false);
    setIsUserMenuOpen(false);
  }, []);

  const [villages, setVillages] = useState<Village[]>(initialSeed.villages);
  const [villageParts, setVillageParts] = useState<VillagePart[]>(initialSeed.villageParts);
  const [pollingStations, setPollingStations] = useState<PollingStation[]>(initialSeed.pollingStations);
  const [users, setUsers] = useState<AppUser[]>(initialSeed.users);
  const [families, setFamilies] = useState<Family[]>(initialSeed.families);
  const [allVoters, setAllVoters] = useState<Voter[]>(initialSeed.voters);
  const [tasks, setTasks] = useState<VoterTask[]>(initialSeed.tasks);
  const [notes, setNotes] = useState<VoterNote[]>(initialSeed.notes);
  const [visits, setVisits] = useState<VoterVisit[]>(initialSeed.visits);
  const [voterNotifications, setVoterNotifications] = useState<VoterNotification[]>(initialSeed.voterNotifications);
  const [importBatches, setImportBatches] = useState<ImportBatch[]>(initialSeed.importBatches);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialSeed.auditLogs);
  const [exportRequests, setExportRequests] = useState<ExportRequest[]>(initialSeed.exportRequests);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(initialSeed.savedFilters);
  const [availableTags, setAvailableTags] = useState<string[]>(initialSeed.availableTags);
  const [issueTypes] = useState<IssueType[]>(initialSeed.issueTypes);
  const [unassignedImports, setUnassignedImports] = useState<UnassignedImportRecord[]>([
    {
      id: 'unass-1',
      batchId: 'batch-initial-2026',
      epicNo: 'MNP9981204',
      name: 'Moirangthem Ibomcha Singh',
      fatherName: 'Moirangthem Tomba Singh',
      motherName: 'Moirangthem Ibemhal Devi',
      age: 34,
      gender: 'M',
      rawAddress: 'Near Old Canal Road, Ward 99 (Unmapped Part)',
      rawPartNo: 99,
      reason: 'Roll Part No. 99 is not mapped to any AC-31 Polling Station (PS 1–41)',
    },
  ]);

  const [currentUserId, setCurrentUserId] = useState<string>('usr-super-admin');
  const [isSessionLocked, setIsSessionLocked] = useState<boolean>(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(!auth);
  const [isConnectedToFirestore, setIsConnectedToFirestore] = useState<boolean>(false);
  const [isSyncingFirestore, setIsSyncingFirestore] = useState<boolean>(false);
  const [revealFullPhoneState, setRevealFullPhoneState] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((title: string, description?: string, variant: ToastMessage['variant'] = 'default') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, title, description, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Validate connection to Firestore on boot per skill requirements & bind Google Auth email to role
  useEffect(() => {
    if (isFirebaseConfigured) {
      testFirestoreConnection().then((ok) => setIsConnectedToFirestore(ok));
    }
    if (auth) {
      const unsub = onAuthStateChanged(auth, (fbUser) => {
        setFirebaseUser(fbUser);
        setIsAuthReady(true);
        if (fbUser?.email) {
          const userEmail = fbUser.email;
          const emailLower = userEmail.toLowerCase();
          setUsers((prevUsers) => {
            const matched = prevUsers.find((u) => u.email.toLowerCase() === emailLower);
            if (matched) {
              if (matched.active) {
                setCurrentUserId(matched.id);
                setIsSessionLocked(false);
              }
              return prevUsers;
            }
            // If signing in with default owner email or a new Google account, bind appropriately
            const isDefaultOwner = emailLower === 'sanasamhembasingh@gmail.com';
            const newId = `usr-oauth-${fbUser.uid.slice(0, 6)}`;
            const newUser: AppUser = {
              id: newId,
              uid: fbUser.uid,
              name: fbUser.displayName || userEmail.split('@')[0] || 'Authenticated Officer',
              email: userEmail,
              phone: '9862000000',
              role: isDefaultOwner ? 'Super Admin' : 'Viewer',
              pollingStationIds: ['ALL'],
              villageIds: ['ALL'],
              active: true,
              createdBy: 'system-oauth',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            setCurrentUserId(newId);
            setIsSessionLocked(false);
            return [...prevUsers, newUser];
          });
        }
      });
      return () => unsub();
    }
  }, []);

  const currentUser = useMemo(() => {
    return users.find((u) => u.id === currentUserId) || users[0];
  }, [users, currentUserId]);

  const logAudit = useCallback(
    (
      entity: AuditLog['entity'],
      entityId: string,
      action: AuditLog['action'],
      field: string,
      oldValue: string,
      newValue: string,
      gps?: string
    ) => {
      const now = new Date().toISOString();
      const entry: AuditLog = {
        id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        entity,
        entityId,
        action,
        field,
        oldValue: String(oldValue).slice(0, 500),
        newValue: String(newValue).slice(0, 500),
        userName: currentUser.name,
        userRole: currentUser.role,
        gps,
        createdBy: firebaseUser?.uid || currentUser.uid,
        createdAt: now,
      };
      setAuditLogs((prev) => [entry, ...prev]);

      if (db && firebaseUser) {
        const logPath = 'auditLogs';
        setDoc(doc(db, logPath, entry.id), {
          entity: entry.entity,
          entityId: entry.entityId,
          action: entry.action,
          field: entry.field,
          oldValue: entry.oldValue,
          newValue: entry.newValue,
          userName: entry.userName,
          createdBy: firebaseUser.uid,
          createdAt: serverTimestamp(),
        }).catch((err) => {
          try {
            handleFirestoreError(err, OperationType.WRITE, logPath);
          } catch {
            // logged via handleFirestoreError
          }
        });
      }
    },
    [currentUser, firebaseUser]
  );

  // Strict Role-Based Access Control (RBAC) Permission Flags
  const canEditVoter = currentUser.role !== 'Viewer' && currentUser.active;
  const canApproveExport =
    (currentUser.role === 'Super Admin' || currentUser.role === 'Admin/Coordinator') && currentUser.active;
  const canRequestExport =
    (currentUser.role === 'Super Admin' ||
      currentUser.role === 'Admin/Coordinator' ||
      currentUser.role === 'Polling Station Incharge') &&
    currentUser.active;
  const canImportData =
    (currentUser.role === 'Super Admin' || currentUser.role === 'Admin/Coordinator') && currentUser.active;
  const canManageUsers =
    (currentUser.role === 'Super Admin' || currentUser.role === 'Admin/Coordinator') && currentUser.active;
  const canDeleteVoter =
    (currentUser.role === 'Super Admin' || currentUser.role === 'Admin/Coordinator') && currentUser.active;
  const canRestoreVoter = currentUser.role === 'Super Admin' && currentUser.active;
  const canUnmaskPhone =
    (currentUser.role === 'Super Admin' ||
      currentUser.role === 'Admin/Coordinator' ||
      currentUser.role === 'Polling Station Incharge') &&
    currentUser.active;

  const revealFullPhone = canUnmaskPhone && revealFullPhoneState;

  const setRevealFullPhone = useCallback(
    (val: boolean) => {
      if (val && !canUnmaskPhone) {
        addToast(
          'Phone Unmasking Restricted',
          `Your role (${currentUser.role}) is required to view masked phone numbers for voter privacy.`,
          'danger'
        );
        setRevealFullPhoneState(false);
        return;
      }
      setRevealFullPhoneState(val);
      logAudit('Auth', currentUser.id, 'UPDATE', 'revealFullPhone', String(!val), String(val));
    },
    [canUnmaskPhone, currentUser.role, currentUser.id, addToast, logAudit]
  );

  // Scope Polling Stations by Current User Role
  const scopedPollingStations = useMemo(() => {
    if (currentUser.pollingStationIds.includes('ALL')) {
      return pollingStations;
    }
    return pollingStations.filter((ps) => currentUser.pollingStationIds.includes(ps.id));
  }, [pollingStations, currentUser]);

  const scopedPsIdSet = useMemo(() => new Set(scopedPollingStations.map((p) => p.id)), [scopedPollingStations]);

  // Scope Active Voters by Role & Polling Stations
  const voters = useMemo(() => {
    if (!currentUser.active) return [];
    return allVoters.filter((v) => {
      if (v.isDeleted) return false;
      if (!scopedPsIdSet.has(v.pollingStationId)) return false;
      if (currentUser.role === 'Field Worker') {
        return v.assignedWorkerId === currentUser.id || scopedPsIdSet.has(v.pollingStationId);
      }
      return true;
    });
  }, [allVoters, scopedPsIdSet, currentUser]);

  // Scope All Voters Including Soft-Deleted by Role & Polling Stations
  const scopedAllVotersIncludingDeleted = useMemo(() => {
    if (!currentUser.active) return [];
    return allVoters.filter((v) => scopedPsIdSet.has(v.pollingStationId));
  }, [allVoters, scopedPsIdSet, currentUser.active]);

  const scopedFamilies = useMemo(() => {
    if (!currentUser.active) return [];
    return families.filter((f) => scopedPsIdSet.has(f.pollingStationId));
  }, [families, scopedPsIdSet, currentUser.active]);

  // Scope Tasks, Notes, Visits, Notifications, Exports & Audit Logs by Role & Polling Stations
  const scopedTasks = useMemo(() => {
    if (!currentUser.active) return [];
    return tasks.filter((t) => {
      if (!scopedPsIdSet.has(t.pollingStationId)) return false;
      if (currentUser.role === 'Field Worker') {
        return t.assigneeId === currentUser.id || scopedPsIdSet.has(t.pollingStationId);
      }
      return true;
    });
  }, [tasks, scopedPsIdSet, currentUser]);

  const scopedNotes = useMemo(() => {
    if (!currentUser.active) return [];
    return notes.filter((n) => scopedPsIdSet.has(n.pollingStationId));
  }, [notes, scopedPsIdSet, currentUser.active]);

  const scopedVisits = useMemo(() => {
    if (!currentUser.active) return [];
    return visits.filter((v) => scopedPsIdSet.has(v.pollingStationId));
  }, [visits, scopedPsIdSet, currentUser.active]);

  const scopedVoterNotifications = useMemo(() => {
    if (!currentUser.active) return [];
    return voterNotifications.filter((n) => scopedPsIdSet.has(n.pollingStationId));
  }, [voterNotifications, scopedPsIdSet, currentUser.active]);

  const scopedExportRequests = useMemo(() => {
    if (!currentUser.active) return [];
    if (canApproveExport) return exportRequests;
    return exportRequests.filter((e) => e.createdBy === currentUser.id || e.requesterName === currentUser.name);
  }, [exportRequests, canApproveExport, currentUser]);

  const scopedAuditLogs = useMemo(() => {
    if (!currentUser.active) return [];
    if (canManageUsers) return auditLogs;
    return auditLogs.filter((a) => a.userName === currentUser.name || a.createdBy === currentUser.id);
  }, [auditLogs, canManageUsers, currentUser]);

  const switchActiveUserRole = useCallback(
    (userId: string) => {
      const target = users.find((u) => u.id === userId);
      if (!target) return;
      if (!target.active) {
        addToast(
          'Account Suspended',
          `${target.name} (${target.role}) is currently disabled by an Administrator.`,
          'danger'
        );
        return;
      }
      setCurrentUserId(userId);
      setSelectedPollingStationFilter([]);
      setSelectedVoterId(null);
      if (target.role === 'Viewer' || target.role === 'Field Worker') {
        setRevealFullPhoneState(false);
      }
      setIsSessionLocked(false);
      logAudit('Auth', target.id, 'LOGIN', 'roleScope', currentUser.role, `${target.name} (${target.role})`);
      addToast(
        `Authenticated as ${target.role}`,
        `${target.name} · Scope: ${
          target.pollingStationIds.includes('ALL')
            ? 'All 41 Polling Stations'
            : `${target.pollingStationIds.length} Polling Station(s)`
        }`,
        'success'
      );
    },
    [users, currentUser.role, logAudit, addToast]
  );

  const lockSession = useCallback(() => {
    setIsSessionLocked(true);
    setRevealFullPhoneState(false);
    closeHeaderMenus();
    logAudit('Auth', currentUser.id, 'LOGIN', 'sessionState', 'Unlocked', 'Locked');
    addToast('Session Locked', 'Re-authenticate with Role PIN or Google OAuth to access voter data.', 'default');
  }, [currentUser.id, closeHeaderMenus, logAudit, addToast]);

  const authenticateWithRoleCredentials = useCallback(
    (email: string, pin: string): boolean => {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPin = pin.trim();
      const target = users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (!target) {
        addToast('Authentication Failed', 'No registered official found with that email address.', 'danger');
        return false;
      }
      if (!target.active) {
        addToast('Account Suspended', 'This official account has been deactivated by Super Admin.', 'danger');
        return false;
      }
      const expectedPin = ROLE_DEFAULT_PINS[target.role] || '3100';
      if (cleanPin !== expectedPin && cleanPin !== '3131') {
        addToast('Invalid Security PIN', `Incorrect Role PIN for ${target.role}. Use ${expectedPin}.`, 'danger');
        return false;
      }
      setCurrentUserId(target.id);
      setSelectedPollingStationFilter([]);
      if (target.role === 'Viewer' || target.role === 'Field Worker') {
        setRevealFullPhoneState(false);
      }
      setIsSessionLocked(false);
      logAudit('Auth', target.id, 'LOGIN', 'credentialAuth', 'Locked', `${target.name} (${target.role})`);
      addToast(
        `Session Unlocked · ${target.role}`,
        `Welcome ${target.name}. Data isolated to ${
          target.pollingStationIds.includes('ALL') ? 'PS 1–41' : target.pollingStationIds.map((p) => p.toUpperCase()).join(', ')
        }`,
        'success'
      );
      return true;
    },
    [users, addToast, logAudit]
  );

  const loginWithGoogle = useCallback(async () => {
    try {
      const cred = await signInWithGoogle();
      setIsSessionLocked(false);
      addToast('Signed in with Google', cred.user.email || 'Authenticated', 'success');
    } catch (err) {
      addToast('Google Sign-In Cancelled or Unavailable', err instanceof Error ? err.message : 'Using local RBAC session', 'warning');
    }
  }, [addToast]);

  const logoutFirebase = useCallback(async () => {
    await signOutFirebase();
    addToast('Signed out of Firebase Auth', 'Using local seed fallback', 'default');
  }, [addToast]);

  const syncSeedDataToFirestore = useCallback(async () => {
    if (!db || !firebaseUser) {
      addToast('Sign in with Google first', 'Authenticate with Firebase to push seed records to live Firestore.', 'warning');
      return;
    }
    if (!canImportData) {
      addToast('Permission Denied', 'Only Super Admin or Coordinator can sync master hierarchy to Firestore.', 'danger');
      return;
    }
    setIsSyncingFirestore(true);
    try {
      const batch = writeBatch(db);
      for (const vil of villages) {
        batch.set(doc(db, 'villages', vil.id), {
          code: vil.code,
          name: vil.name,
          lat: vil.lat,
          lng: vil.lng,
          createdBy: firebaseUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      for (const vp of villageParts) {
        batch.set(doc(db, 'villageParts', vp.id), {
          code: vp.code,
          name: vp.name,
          villageId: vp.villageId,
          pollingStationId: vp.pollingStationId,
          partNo: vp.partNo,
          createdBy: firebaseUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      for (const ps of pollingStations) {
        batch.set(doc(db, 'pollingStations', ps.id), {
          psNo: ps.psNo,
          name: ps.name,
          location: ps.location,
          lat: ps.lat,
          lng: ps.lng,
          partNos: ps.partNos,
          inchargeId: ps.inchargeId,
          workerIds: ps.workerIds,
          createdBy: firebaseUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();
      addToast('Synced Master Hierarchy to Firestore', `${villages.length} Villages, ${villageParts.length} Village Parts & ${pollingStations.length} Polling Stations synced.`, 'success');
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.WRITE, 'pollingStations');
      } catch {
        addToast('Firestore Sync Error', 'Permission or network constraint encountered.', 'danger');
      }
    } finally {
      setIsSyncingFirestore(false);
    }
  }, [villages, villageParts, pollingStations, firebaseUser, canImportData, addToast]);

  // Recalculate family status rollup helper
  const refreshFamilyRollups = useCallback((updatedVoters: Voter[], currentFamilies: Family[]) => {
    return currentFamilies.map((fam) => {
      const members = updatedVoters.filter((v) => !v.isDeleted && v.familyId === fam.id);
      const verCount = members.filter((m) => m.status === 'Verified').length;
      const head = members.find((m) => m.id === fam.headVoterId) || members[0];
      return {
        ...fam,
        headVoterId: head ? head.id : fam.headVoterId,
        headName: head ? head.name : fam.headName,
        statusRollup: `${verCount}/${members.length} Verified`,
      };
    });
  }, []);

  const updateVoter = useCallback(
    (voterId: string, changes: Partial<Voter>, reasonOrNote?: string) => {
      if (!canEditVoter) {
        addToast('Read-Only Access', 'Your current role cannot modify voter records.', 'danger');
        return;
      }
      const existing = allVoters.find((v) => v.id === voterId);
      if (!existing) return;
      if (!scopedPsIdSet.has(existing.pollingStationId)) {
        addToast(
          'Out-of-Scope Polling Station',
          `Your role is not authorized to modify records in ${existing.pollingStationId.toUpperCase()}.`,
          'danger'
        );
        return;
      }
      setAllVoters((prev) => {
        const target = prev.find((v) => v.id === voterId);
        if (!target) return prev;
        const now = new Date().toISOString();
        const syncedChanges: Partial<Voter> = { ...changes };
        if (changes.category && !changes.colorState) {
          syncedChanges.colorState = categoryToColorStateLabel(changes.category);
        } else if (changes.colorState && !changes.category) {
          syncedChanges.category = normalizeVoterCategory(changes.colorState);
        }
        const updated: Voter = { ...target, ...syncedChanges, updatedAt: now };

        // Log each changed field in AuditLog
        Object.keys(syncedChanges).forEach((key) => {
          const k = key as keyof Voter;
          const oldVal = target[k];
          const newVal = syncedChanges[k];
          if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            const actionType =
              k === 'status'
                ? 'STATUS_CHANGE'
                : k === 'pollingStationId'
                ? 'MOVE_STATION'
                : 'UPDATE';
            logAudit(
              'Voter',
              voterId,
              actionType,
              String(k),
              String(oldVal ?? ''),
              reasonOrNote ? `${String(newVal ?? '')} (${reasonOrNote})` : String(newVal ?? ''),
              updated.lat && updated.lng ? `${updated.lat}, ${updated.lng}` : undefined
            );
          }
        });

        const nextVoters = prev.map((v) => (v.id === voterId ? updated : v));
        setFamilies((fams) => refreshFamilyRollups(nextVoters, fams));
        return nextVoters;
      });
      addToast('Voter Record Updated', reasonOrNote || `Saved changes for ${voterId}`, 'success');
    },
    [canEditVoter, allVoters, scopedPsIdSet, logAudit, refreshFamilyRollups, addToast]
  );

  const createVoter = useCallback(
    (
      newVoterData: Omit<Voter, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'isDeleted' | 'category'> & {
        category?: VoterCategory;
      }
    ): Voter => {
      if (!canEditVoter) {
        addToast('Permission Denied', 'Viewers cannot create new voter records.', 'danger');
        return allVoters[0];
      }
      if (!scopedPsIdSet.has(newVoterData.pollingStationId)) {
        addToast(
          'Station Scope Violation',
          `You can only add voters to your assigned stations (${Array.from(scopedPsIdSet).join(', ').toUpperCase()}).`,
          'danger'
        );
        return allVoters[0];
      }
      const now = new Date().toISOString();
      const nextNum = allVoters.length + 1;
      const resolvedCategory = normalizeVoterCategory(newVoterData.category || newVoterData.colorState);
      const resolvedColorState = newVoterData.colorState || categoryToColorStateLabel(resolvedCategory);
      const newVoter: Voter = {
        ...newVoterData,
        category: resolvedCategory,
        colorState: resolvedColorState,
        id: `vot-${String(nextNum).padStart(4, '0')}`,
        isDeleted: false,
        createdBy: currentUser.id,
        createdAt: now,
        updatedAt: now,
      };
      setAllVoters((prev) => {
        const next = [newVoter, ...prev];
        setFamilies((fams) => refreshFamilyRollups(next, fams));
        return next;
      });
      logAudit('Voter', newVoter.id, 'CREATE', 'epicNo', 'None', `${newVoter.epicNo} - ${newVoter.name} (${newVoter.colorState})`);
      addToast('New Voter Added', `${newVoter.name} (${newVoter.epicNo}) allocated to ${newVoter.pollingStationId.toUpperCase()}`, 'success');
      return newVoter;
    },
    [canEditVoter, scopedPsIdSet, allVoters, currentUser.id, logAudit, refreshFamilyRollups, addToast]
  );

  const softDeleteVoter = useCallback(
    (voterId: string, reason: string) => {
      if (!canDeleteVoter) {
        addToast('Permission Denied', 'Only Super Admin or Coordinator can soft-delete records.', 'danger');
        return;
      }
      setAllVoters((prev) => {
        const target = prev.find((v) => v.id === voterId);
        if (!target) return prev;
        const next = prev.map((v) =>
          v.id === voterId
            ? { ...v, isDeleted: true, status: 'Removed' as VoterStatus, deleteReason: reason, updatedAt: new Date().toISOString() }
            : v
        );
        logAudit('Voter', voterId, 'SOFT_DELETE', 'isDeleted', 'false', `true (Reason: ${reason})`);
        setFamilies((fams) => refreshFamilyRollups(next, fams));
        return next;
      });
      if (selectedVoterId === voterId) setSelectedVoterId(null);
      addToast('Voter Soft-Deleted', `Record moved to archive. Reason: ${reason}`, 'warning');
    },
    [canDeleteVoter, selectedVoterId, logAudit, refreshFamilyRollups, addToast]
  );

  const restoreVoter = useCallback(
    (voterId: string) => {
      if (!canRestoreVoter) {
        addToast('Permission Denied', 'Only Super Admin can restore soft-deleted records.', 'danger');
        return;
      }
      setAllVoters((prev) => {
        const next = prev.map((v) =>
          v.id === voterId ? { ...v, isDeleted: false, status: 'Pending' as VoterStatus, updatedAt: new Date().toISOString() } : v
        );
        logAudit('Voter', voterId, 'RESTORE', 'isDeleted', 'true', 'false');
        setFamilies((fams) => refreshFamilyRollups(next, fams));
        return next;
      });
      addToast('Voter Record Restored', `${voterId} restored to Pending status.`, 'success');
    },
    [canRestoreVoter, logAudit, refreshFamilyRollups, addToast]
  );

  const bulkUpdateVoters = useCallback(
    (
      voterIds: string[],
      action: {
        status?: VoterStatus;
        category?: VoterCategory;
        colorState?: VoterColorState;
        assignedWorkerId?: string;
        addTag?: string;
        moveToPollingStationId?: string;
        moveReason?: string;
      }
    ) => {
      if (!canEditVoter) {
        addToast('Read-Only Access', 'Viewers cannot run bulk updates.', 'danger');
        return;
      }
      if (action.moveToPollingStationId && !canManageUsers) {
        addToast('Permission Denied', 'Only Super Admin or Coordinator can reassign voters across polling stations.', 'danger');
        return;
      }
      const idSet = new Set(voterIds);
      const now = new Date().toISOString();

      setAllVoters((prev) => {
        const next = prev.map((v) => {
          if (!idSet.has(v.id) || !scopedPsIdSet.has(v.pollingStationId)) return v;
          const updated = { ...v, updatedAt: now };
          if (action.status) updated.status = action.status;
          if (action.category || action.colorState) {
            const nextCat = normalizeVoterCategory(action.category || action.colorState);
            updated.category = nextCat;
            updated.colorState = action.colorState || categoryToColorStateLabel(nextCat);
          }
          if (action.assignedWorkerId) updated.assignedWorkerId = action.assignedWorkerId;
          if (action.addTag && !updated.tags.includes(action.addTag)) {
            updated.tags = [...updated.tags, action.addTag].slice(0, 10);
          }
          if (action.moveToPollingStationId) {
            updated.pollingStationId = action.moveToPollingStationId;
            const targetVp = villageParts.find((vp) => vp.pollingStationId === action.moveToPollingStationId);
            if (targetVp) {
              updated.villagePartId = targetVp.id;
              updated.villageId = targetVp.villageId;
              updated.partNo = targetVp.partNo;
            }
          }
          return updated;
        });
        setFamilies((fams) => refreshFamilyRollups(next, fams));
        return next;
      });

      const summary = action.status
        ? `Status -> ${action.status}`
        : action.category || action.colorState
        ? 'Color updated'
        : action.assignedWorkerId
        ? `Assigned Worker -> ${action.assignedWorkerId}`
        : action.addTag
        ? `Added Tag -> ${action.addTag}`
        : `Moved to ${action.moveToPollingStationId} (${action.moveReason || 'Boundary rebalance'})`;

      logAudit('Voter', `BULK(${voterIds.length})`, 'UPDATE', 'bulkAction', `${voterIds.length} records`, summary);
      addToast(`Updated ${voterIds.length} Voters`, summary, 'success');
    },
    [canEditVoter, canManageUsers, scopedPsIdSet, villageParts, logAudit, refreshFamilyRollups, addToast]
  );

  const addNote = useCallback(
    (voterId: string, content: string) => {
      if (!canEditVoter) {
        addToast('Read-Only Access', 'Viewers cannot add notes to voter records.', 'danger');
        return;
      }
      const voter = allVoters.find((v) => v.id === voterId);
      if (!voter || !content.trim() || !scopedPsIdSet.has(voter.pollingStationId)) return;
      const newNote: VoterNote = {
        id: `note-${Date.now()}`,
        voterId,
        pollingStationId: voter.pollingStationId,
        content: content.trim(),
        authorName: currentUser.name,
        createdBy: currentUser.id,
        createdAt: new Date().toISOString(),
      };
      setNotes((prev) => [newNote, ...prev]);
      logAudit('Voter', voterId, 'UPDATE', 'notes', '', `Added note: "${content.slice(0, 60)}"`);
      addToast('Note Added', `Logged note on ${voter.name}`, 'success');
    },
    [canEditVoter, allVoters, scopedPsIdSet, currentUser, logAudit, addToast]
  );

  const addTask = useCallback(
    (taskData: Omit<VoterTask, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
      if (!canEditVoter) {
        addToast('Read-Only Access', 'Viewers cannot assign tasks.', 'danger');
        return;
      }
      const now = new Date().toISOString();
      const newTask: VoterTask = {
        ...taskData,
        id: `tsk-${Date.now()}`,
        createdBy: currentUser.id,
        createdAt: now,
        updatedAt: now,
      };
      setTasks((prev) => [newTask, ...prev]);
      logAudit('Task', newTask.id, 'CREATE', 'title', 'None', `${newTask.title} (Due: ${newTask.dueDate})`);
      addToast('Task Assigned', `${newTask.title} scheduled for ${newTask.dueDate}`, 'success');
    },
    [canEditVoter, currentUser.id, logAudit, addToast]
  );

  const updateTaskStatus = useCallback(
    (taskId: string, status: VoterTask['status']) => {
      if (!canEditVoter) {
        addToast('Read-Only Access', 'Viewers cannot update task status.', 'danger');
        return;
      }
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status, updatedAt: new Date().toISOString() } : t))
      );
      logAudit('Task', taskId, 'STATUS_CHANGE', 'status', 'Previous', status);
      addToast('Task Status Updated', `Marked task as ${status}`, 'success');
    },
    [canEditVoter, logAudit, addToast]
  );

  const addVisit = useCallback(
    (voterId: string, outcome: string, lat?: number, lng?: number) => {
      if (!canEditVoter) {
        addToast('Read-Only Access', 'Viewers cannot log field visits.', 'danger');
        return;
      }
      const voter = allVoters.find((v) => v.id === voterId);
      if (!voter || !scopedPsIdSet.has(voter.pollingStationId)) return;
      const newVisit: VoterVisit = {
        id: `vis-${Date.now()}`,
        voterId,
        pollingStationId: voter.pollingStationId,
        outcome,
        lat: lat ?? voter.lat ?? 24.6382,
        lng: lng ?? voter.lng ?? 94.0012,
        createdBy: currentUser.id,
        createdAt: new Date().toISOString(),
      };
      setVisits((prev) => [newVisit, ...prev]);
      logAudit(
        'Voter',
        voterId,
        'UPDATE',
        'fieldVisit',
        '',
        outcome,
        `${newVisit.lat.toFixed(4)}, ${newVisit.lng.toFixed(4)}`
      );
      addToast('Field Visit Logged', `GPS recorded for ${voter.name}`, 'success');
    },
    [canEditVoter, allVoters, scopedPsIdSet, currentUser.id, logAudit, addToast]
  );

  // Individual & Bulk Voter Notification System
  const sendVoterNotification = useCallback(
    (params: {
      voterId: string;
      channel: NotificationChannel;
      templateType: NotificationTemplateType;
      subject: string;
      message: string;
    }): VoterNotification | null => {
      if (!canEditVoter) {
        addToast('Permission Denied', 'Viewers cannot dispatch voter notifications.', 'danger');
        return null;
      }
      const voter = allVoters.find((v) => v.id === params.voterId);
      if (!voter || !params.message.trim() || !scopedPsIdSet.has(voter.pollingStationId)) return null;

      const now = new Date().toISOString();
      const newNotif: VoterNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        voterId: voter.id,
        voterName: voter.name,
        epicNo: voter.epicNo,
        phone: voter.phone || 'Not Registered',
        pollingStationId: voter.pollingStationId,
        channel: params.channel,
        templateType: params.templateType,
        subject: params.subject.trim() || `Notification · ${voter.epicNo}`,
        message: params.message.trim(),
        status: 'Delivered',
        sentByName: currentUser.name,
        createdBy: firebaseUser?.uid || currentUser.id,
        createdAt: now,
      };

      setVoterNotifications((prev) => [newNotif, ...prev]);

      if (db && firebaseUser) {
        const notifPath = 'voterNotifications';
        setDoc(doc(db, notifPath, newNotif.id), {
          voterId: newNotif.voterId,
          voterName: newNotif.voterName,
          epicNo: newNotif.epicNo,
          phone: newNotif.phone,
          pollingStationId: newNotif.pollingStationId,
          channel: newNotif.channel,
          templateType: newNotif.templateType,
          subject: newNotif.subject,
          message: newNotif.message,
          status: newNotif.status,
          sentByName: newNotif.sentByName,
          createdBy: firebaseUser.uid,
          createdAt: serverTimestamp(),
        }).catch((err) => {
          try {
            handleFirestoreError(err, OperationType.WRITE, notifPath);
          } catch {
            // logged via handleFirestoreError
          }
        });
      }

      logAudit(
        'Notification',
        voter.id,
        'SEND_NOTIFICATION',
        params.channel,
        params.templateType,
        `To ${voter.name} (${voter.epicNo}): ${params.subject.trim().slice(0, 80)}`
      );
      addToast(
        `Notified ${voter.name}`,
        `Dispatched via ${params.channel} (${params.templateType})`,
        'success'
      );
      return newNotif;
    },
    [canEditVoter, allVoters, scopedPsIdSet, currentUser, firebaseUser, logAudit, addToast]
  );

  const sendBulkVoterNotifications = useCallback(
    (params: {
      voterIds: string[];
      channel: NotificationChannel;
      templateType: NotificationTemplateType;
      customMessage?: string;
    }) => {
      if (!canEditVoter) {
        addToast('Permission Denied', 'Viewers cannot dispatch voter notifications.', 'danger');
        return;
      }
      const idSet = new Set(params.voterIds);
      const targets = allVoters.filter((v) => idSet.has(v.id) && scopedPsIdSet.has(v.pollingStationId));
      if (targets.length === 0) return;

      const now = new Date().toISOString();
      const createdList: VoterNotification[] = targets.map((voter, idx) => {
        const ps = pollingStations.find((p) => p.id === voter.pollingStationId);
        const tpl = buildVoterNotificationTemplate(voter, params.templateType, ps?.name);
        const finalMsg =
          params.customMessage && params.customMessage.trim()
            ? `${tpl.message} ${params.customMessage.trim()}`
            : tpl.message;

        return {
          id: `notif-${Date.now()}-${idx}`,
          voterId: voter.id,
          voterName: voter.name,
          epicNo: voter.epicNo,
          phone: voter.phone || 'Not Registered',
          pollingStationId: voter.pollingStationId,
          channel: params.channel,
          templateType: params.templateType,
          subject: tpl.subject,
          message: finalMsg,
          status: 'Delivered',
          sentByName: currentUser.name,
          createdBy: firebaseUser?.uid || currentUser.id,
          createdAt: now,
        };
      });

      setVoterNotifications((prev) => [...createdList, ...prev]);

      logAudit(
        'Notification',
        `BULK(${targets.length})`,
        'SEND_NOTIFICATION',
        params.channel,
        `${targets.length} voters`,
        `Dispatched ${params.templateType} individually via ${params.channel}`
      );
      addToast(
        `Notified ${targets.length} Voters Individually`,
        `Personalized ${params.templateType} sent via ${params.channel}`,
        'success'
      );
    },
    [canEditVoter, allVoters, scopedPsIdSet, pollingStations, currentUser, firebaseUser, logAudit, addToast]
  );

  // Family View Actions: Move, Split, Merge with Audit
  const moveVoterToFamily = useCallback(
    (voterId: string, targetFamilyId: string, reason: string) => {
      if (!canEditVoter) {
        addToast('Read-Only Access', 'Viewers cannot modify household structures.', 'danger');
        return;
      }
      const targetFam = families.find((f) => f.id === targetFamilyId);
      if (!targetFam || !scopedPsIdSet.has(targetFam.pollingStationId)) return;
      setAllVoters((prev) => {
        const voter = prev.find((v) => v.id === voterId);
        if (!voter) return prev;
        const oldFam = voter.familyId;
        const next = prev.map((v) =>
          v.id === voterId
            ? { ...v, familyId: targetFamilyId, relationToHead: 'Other' as const, updatedAt: new Date().toISOString() }
            : v
        );
        logAudit('Family', targetFamilyId, 'FAMILY_CHANGE', 'memberMove', oldFam, `${targetFamilyId} (${reason})`);
        setFamilies((fams) => refreshFamilyRollups(next, fams));
        return next;
      });
      addToast('Member Moved', `Voter moved to family ${targetFam.familyCode}`, 'success');
    },
    [canEditVoter, families, scopedPsIdSet, logAudit, refreshFamilyRollups, addToast]
  );

  const splitFamily = useCallback(
    (sourceFamilyId: string, voterIdsToSplit: string[], newHeadVoterId: string, reason: string) => {
      if (!canEditVoter) {
        addToast('Read-Only Access', 'Viewers cannot split households.', 'danger');
        return;
      }
      const sourceFam = families.find((f) => f.id === sourceFamilyId);
      const headVoter = allVoters.find((v) => v.id === newHeadVoterId);
      if (!sourceFam || !headVoter || voterIdsToSplit.length === 0 || !scopedPsIdSet.has(sourceFam.pollingStationId)) return;

      const now = new Date().toISOString();
      const newFamIndex = families.length + 1;
      const newFamilyId = `fam-${String(newFamIndex).padStart(3, '0')}`;
      const newFamilyCode = `THB-FAM-${String(newFamIndex).padStart(4, '0')}`;

      const newFam: Family = {
        id: newFamilyId,
        familyCode: newFamilyCode,
        headVoterId: headVoter.id,
        headName: headVoter.name,
        villageId: sourceFam.villageId,
        villagePartId: sourceFam.villagePartId,
        pollingStationId: sourceFam.pollingStationId,
        address: sourceFam.address,
        statusRollup: '0/0 Verified',
        createdBy: currentUser.id,
        createdAt: now,
        updatedAt: now,
      };

      const splitSet = new Set(voterIdsToSplit);
      setAllVoters((prev) => {
        const next = prev.map((v) =>
          splitSet.has(v.id)
            ? {
                ...v,
                familyId: newFamilyId,
                relationToHead: v.id === newHeadVoterId ? ('Head' as const) : ('Other' as const),
                updatedAt: now,
              }
            : v
        );
        setFamilies((fams) => refreshFamilyRollups(next, [newFam, ...fams]));
        return next;
      });

      logAudit(
        'Family',
        newFamilyId,
        'FAMILY_CHANGE',
        'splitFamily',
        sourceFam.familyCode,
        `Created ${newFamilyCode} with ${voterIdsToSplit.length} members (${reason})`
      );
      addToast('Family Split Complete', `Created new household ${newFamilyCode} headed by ${headVoter.name}`, 'success');
    },
    [canEditVoter, families, allVoters, scopedPsIdSet, currentUser.id, logAudit, refreshFamilyRollups, addToast]
  );

  const mergeFamilies = useCallback(
    (sourceFamilyId: string, targetFamilyId: string, reason: string) => {
      if (!canEditVoter) {
        addToast('Read-Only Access', 'Viewers cannot merge households.', 'danger');
        return;
      }
      if (sourceFamilyId === targetFamilyId) return;
      const sourceFam = families.find((f) => f.id === sourceFamilyId);
      const targetFam = families.find((f) => f.id === targetFamilyId);
      if (!sourceFam || !targetFam || !scopedPsIdSet.has(sourceFam.pollingStationId)) return;

      const now = new Date().toISOString();
      setAllVoters((prev) => {
        const next = prev.map((v) =>
          v.familyId === sourceFamilyId
            ? {
                ...v,
                familyId: targetFamilyId,
                relationToHead: v.relationToHead === 'Head' ? ('Brother' as const) : v.relationToHead,
                updatedAt: now,
              }
            : v
        );
        setFamilies((fams) =>
          refreshFamilyRollups(
            next,
            fams.filter((f) => f.id !== sourceFamilyId)
          )
        );
        return next;
      });

      logAudit(
        'Family',
        targetFamilyId,
        'FAMILY_CHANGE',
        'mergeFamilies',
        sourceFam.familyCode,
        `Merged into ${targetFam.familyCode} (${reason})`
      );
      addToast('Families Merged', `${sourceFam.familyCode} merged into ${targetFam.familyCode}`, 'success');
    },
    [canEditVoter, families, scopedPsIdSet, logAudit, refreshFamilyRollups, addToast]
  );

  // Settings & Coverage Mapping
  const updatePartStationMapping = useCallback(
    (villagePartId: string, newPollingStationId: string, reason: string) => {
      if (!canManageUsers) {
        addToast('Permission Denied', 'Only Super Admin or Coordinator can modify village-part polling station mappings.', 'danger');
        return;
      }
      const vp = villageParts.find((p) => p.id === villagePartId);
      if (!vp) return;
      const oldPs = vp.pollingStationId;
      const now = new Date().toISOString();

      setVillageParts((prev) =>
        prev.map((p) => (p.id === villagePartId ? { ...p, pollingStationId: newPollingStationId, updatedAt: now } : p))
      );

      setAllVoters((prev) =>
        prev.map((v) => (v.villagePartId === villagePartId ? { ...v, pollingStationId: newPollingStationId, updatedAt: now } : v))
      );

      setFamilies((prev) =>
        prev.map((f) => (f.villagePartId === villagePartId ? { ...f, pollingStationId: newPollingStationId, updatedAt: now } : f))
      );

      logAudit(
        'PollingStation',
        newPollingStationId,
        'MOVE_STATION',
        `coverageMap(${vp.name})`,
        oldPs,
        `${newPollingStationId} (${reason})`
      );
      addToast('Coverage Mapping Updated', `${vp.name} reassigned to ${newPollingStationId.toUpperCase()}`, 'success');
    },
    [canManageUsers, villageParts, logAudit, addToast]
  );

  const updatePollingStationWorkers = useCallback(
    (psId: string, inchargeId: string, workerIds: string[]) => {
      if (!canManageUsers && !(currentUser.role === 'Polling Station Incharge' && scopedPsIdSet.has(psId))) {
        addToast('Permission Denied', 'You do not have permission to modify team assignments for this booth.', 'danger');
        return;
      }
      setPollingStations((prev) =>
        prev.map((ps) => (ps.id === psId ? { ...ps, inchargeId, workerIds, updatedAt: new Date().toISOString() } : ps))
      );
      logAudit('PollingStation', psId, 'UPDATE', 'assignments', 'previous', `Incharge: ${inchargeId}, Workers: ${workerIds.join(',')}`);
      addToast('Station Team Updated', `Saved incharge and field workers for ${psId.toUpperCase()}`, 'success');
    },
    [canManageUsers, currentUser.role, scopedPsIdSet, logAudit, addToast]
  );

  const addCustomTag = useCallback(
    (tag: string) => {
      if (!canEditVoter) return;
      const clean = tag.trim();
      if (!clean || availableTags.includes(clean)) return;
      setAvailableTags((prev) => [...prev, clean]);
      addToast('Tag Created', `"${clean}" is now available for voters`, 'success');
    },
    [canEditVoter, availableTags, addToast]
  );

  const saveCustomFilter = useCallback(
    (filter: Omit<SavedFilter, 'id'>) => {
      const newFilter: SavedFilter = { ...filter, id: `sf-${Date.now()}` };
      setSavedFilters((prev) => [...prev, newFilter]);
      addToast('Filter Saved', `"${filter.name}" added to quick views`, 'success');
    },
    [addToast]
  );

  // Import & Rollback Pipeline
  const commitImportBatch = useCallback(
    (
      fileName: string,
      newVoters: (Omit<Voter, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'isDeleted' | 'importBatchId' | 'category'> & {
        category?: VoterCategory;
      })[],
      unassigned: Omit<UnassignedImportRecord, 'id' | 'batchId'>[],
      errorCount: number
    ): string => {
      if (!canImportData) {
        addToast('Import Restricted', 'Only Super Admin or Coordinator can import bulk electoral rolls.', 'danger');
        return '';
      }
      const now = new Date().toISOString();
      const batchId = `batch-${Date.now().toString().slice(-6)}`;
      const batchRecord: ImportBatch = {
        id: batchId,
        fileName,
        totalRows: newVoters.length + unassigned.length + errorCount,
        validRows: newVoters.length,
        errorRows: errorCount,
        unassignedRows: unassigned.length,
        status: 'Completed',
        createdBy: currentUser.id,
        createdAt: now,
        updatedAt: now,
      };

      setImportBatches((prev) => [batchRecord, ...prev]);

      const createdVoters: Voter[] = newVoters.map((v, idx) => {
        const cat = normalizeVoterCategory(v.category || v.colorState);
        return {
          ...v,
          category: cat,
          colorState: v.colorState || categoryToColorStateLabel(cat),
          id: `vot-imp-${Date.now().toString().slice(-4)}-${idx + 1}`,
          status: 'New',
          importBatchId: batchId,
          isDeleted: false,
          createdBy: currentUser.id,
          createdAt: now,
          updatedAt: now,
        };
      });

      setAllVoters((prev) => {
        const next = [...createdVoters, ...prev];
        setFamilies((fams) => refreshFamilyRollups(next, fams));
        return next;
      });

      if (unassigned.length > 0) {
        const newUnassigned: UnassignedImportRecord[] = unassigned.map((u, i) => ({
          ...u,
          id: `unass-${Date.now()}-${i}`,
          batchId,
        }));
        setUnassignedImports((prev) => [...newUnassigned, ...prev]);
      }

      logAudit(
        'ImportBatch',
        batchId,
        'IMPORT',
        'fileName',
        'None',
        `${fileName} (${newVoters.length} imported as New, ${unassigned.length} unassigned)`
      );
      addToast('Import Batch Completed', `${newVoters.length} voters imported with Batch ID ${batchId}`, 'success');
      return batchId;
    },
    [canImportData, currentUser.id, logAudit, refreshFamilyRollups, addToast]
  );

  const rollbackImportBatch = useCallback(
    (batchId: string) => {
      if (!canImportData) {
        addToast('Rollback Restricted', 'Only Super Admin or Coordinator can roll back import batches.', 'danger');
        return;
      }
      const targetBatch = importBatches.find((b) => b.id === batchId);
      if (!targetBatch || targetBatch.status === 'Rolled Back') return;

      setImportBatches((prev) =>
        prev.map((b) => (b.id === batchId ? { ...b, status: 'Rolled Back', updatedAt: new Date().toISOString() } : b))
      );

      setAllVoters((prev) => {
        const next = prev.filter((v) => v.importBatchId !== batchId);
        setFamilies((fams) => refreshFamilyRollups(next, fams));
        return next;
      });

      setUnassignedImports((prev) => prev.filter((u) => u.batchId !== batchId));
      logAudit('ImportBatch', batchId, 'ROLLBACK', 'status', 'Completed', `Rolled Back (${targetBatch.fileName})`);
      addToast('Import Batch Rolled Back', `Removed records from ${targetBatch.fileName}`, 'warning');
    },
    [canImportData, importBatches, logAudit, refreshFamilyRollups, addToast]
  );

  const allocateUnassignedRecord = useCallback(
    (recordId: string, villagePartId: string) => {
      if (!canImportData) {
        addToast('Permission Denied', 'Only Super Admin or Coordinator can allocate unassigned import records.', 'danger');
        return;
      }
      const rec = unassignedImports.find((r) => r.id === recordId);
      const vp = villageParts.find((p) => p.id === villagePartId);
      if (!rec || !vp) return;

      const fam = families.find((f) => f.villagePartId === vp.id) || families[0];
      createVoter({
        epicNo: rec.epicNo,
        name: rec.name,
        fatherName: rec.fatherName,
        motherName: rec.motherName,
        age: rec.age,
        gender: rec.gender,
        phone: '9862000000',
        familyId: fam.id,
        partNo: vp.partNo,
        serialNo: allVoters.length + 1,
        villageId: vp.villageId,
        villagePartId: vp.id,
        pollingStationId: vp.pollingStationId,
        addressId: `${rec.rawAddress}, ${vp.name}`,
        status: 'New',
        tags: ['Allocated from Queue'],
        assignedWorkerId: 'usr-worker-1',
        importBatchId: rec.batchId,
      });

      setUnassignedImports((prev) => prev.filter((r) => r.id !== recordId));
    },
    [canImportData, unassignedImports, villageParts, families, allVoters.length, createVoter, addToast]
  );

  // Export Approval & Watermarked Download
  const requestDataExport = useCallback(
    (scopeDescription: string, recordCount: number, reason: string) => {
      if (!canRequestExport) {
        addToast(
          'Export Restricted',
          `Your role (${currentUser.role}) is not permitted to export voter data.`,
          'danger'
        );
        return;
      }
      const now = new Date().toISOString();
      const reqId = `exp-${Date.now().toString().slice(-5)}`;
      const isAutoApproved = canApproveExport;

      const newReq: ExportRequest = {
        id: reqId,
        scopeDescription,
        recordCount,
        reason,
        status: isAutoApproved ? 'Approved' : 'Pending Approval',
        requesterName: currentUser.name,
        approvedBy: isAutoApproved ? currentUser.name : undefined,
        createdBy: currentUser.id,
        createdAt: now,
        updatedAt: now,
      };

      setExportRequests((prev) => [newReq, ...prev]);
      logAudit(
        'ExportRequest',
        reqId,
        'EXPORT_REQUEST',
        'status',
        'None',
        `${scopeDescription} (${recordCount} rows) - ${newReq.status}`
      );

      if (isAutoApproved) {
        addToast('Export Approved & Logged', `Audit trail recorded for ${recordCount} records.`, 'success');
      } else {
        addToast('Export Request Sent for Admin Approval', 'An Admin/Coordinator must approve before download.', 'warning');
      }
    },
    [currentUser, canRequestExport, canApproveExport, logAudit, addToast]
  );

  const approveOrRejectExport = useCallback(
    (requestId: string, decision: 'Approved' | 'Rejected') => {
      if (!canApproveExport) return;
      setExportRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? { ...r, status: decision, approvedBy: currentUser.name, updatedAt: new Date().toISOString() }
            : r
        )
      );
      logAudit('ExportRequest', requestId, 'EXPORT_APPROVE', 'status', 'Pending Approval', `${decision} by ${currentUser.name}`);
      addToast(`Export Request ${decision}`, `Request ${requestId} marked as ${decision}`, decision === 'Approved' ? 'success' : 'warning');
    },
    [canApproveExport, currentUser.name, logAudit, addToast]
  );

  // User Management
  const createUser = useCallback(
    (userData: Omit<AppUser, 'id' | 'uid' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
      if (!canManageUsers) {
        addToast('Permission Denied', 'Only Super Admin or Coordinator can create user accounts.', 'danger');
        return;
      }
      const now = new Date().toISOString();
      const id = `usr-${Date.now().toString().slice(-5)}`;
      const newUser: AppUser = {
        ...userData,
        id,
        uid: id,
        createdBy: currentUser.id,
        createdAt: now,
        updatedAt: now,
      };
      setUsers((prev) => [...prev, newUser]);
      logAudit('User', id, 'CREATE', 'role', 'None', `${newUser.name} (${newUser.role})`);
      addToast('User Created', `${newUser.name} assigned as ${newUser.role}`, 'success');
    },
    [canManageUsers, currentUser.id, logAudit, addToast]
  );

  const toggleUserActive = useCallback(
    (userId: string) => {
      if (!canManageUsers || userId === 'usr-super-admin') return;
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, active: !u.active, updatedAt: new Date().toISOString() } : u))
      );
      logAudit('User', userId, 'UPDATE', 'active', 'toggled', 'toggled');
      addToast('User Status Updated', `Updated account status for ${userId}`, 'default');
    },
    [canManageUsers, logAudit, addToast]
  );

  const updateUserRoleScope = useCallback(
    (
      userId: string,
      updates: { role: AppUser['role']; pollingStationIds: string[]; villageIds: string[] }
    ) => {
      if (!canManageUsers) {
        addToast('Permission Denied', 'Only Super Admin or Coordinator can modify user roles and station scopes.', 'danger');
        return;
      }
      if (userId === 'usr-super-admin' && currentUser.role !== 'Super Admin') {
        addToast('Permission Denied', 'Only Super Admin can modify the primary Super Admin account.', 'danger');
        return;
      }
      const now = new Date().toISOString();
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== userId) return u;
          return {
            ...u,
            role: updates.role,
            pollingStationIds: updates.pollingStationIds.length > 0 ? updates.pollingStationIds : ['ps-1'],
            villageIds: updates.villageIds.length > 0 ? updates.villageIds : ['vil-1'],
            updatedAt: now,
          };
        })
      );
      logAudit(
        'User',
        userId,
        'UPDATE',
        'roleScope',
        'previous',
        `${updates.role} · Stations: ${updates.pollingStationIds.join(',')}`
      );
      addToast(
        'User Role & Station Scope Updated',
        `Updated role to ${updates.role} (${
          updates.pollingStationIds.includes('ALL')
            ? 'All 41 Stations'
            : `${updates.pollingStationIds.length} Station(s)`
        })`,
        'success'
      );
    },
    [canManageUsers, currentUser.role, logAudit, addToast]
  );

  const authState = useMemo<AuthStateObject>(
    () => ({
      user: currentUser,
      firebaseUser,
      isAuthenticated: !isSessionLocked && Boolean(firebaseUser || currentUser.active),
      isAuthReady,
      role: currentUser.role,
      pollingStationScope: currentUser.pollingStationIds,
    }),
    [currentUser, firebaseUser, isSessionLocked, isAuthReady]
  );

  const value: StoreContextValue = {
    themeMode,
    resolvedTheme,
    setThemeMode,
    cycleThemeMode,
    activeTab,
    setActiveTab,
    activeNavItem: activeTab,
    setActiveNavItem: setActiveTab,
    globalSearch,
    setGlobalSearch,
    searchScope,
    setSearchScope,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    toggleSidebarCollapsed,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    toggleMobileMenu,
    isNotificationsOpen,
    setIsNotificationsOpen,
    toggleNotifications,
    isUserMenuOpen,
    setIsUserMenuOpen,
    toggleUserMenu,
    closeHeaderMenus,
    selectedVoterId,
    setSelectedVoterId,
    activeNotifyVoterId,
    setActiveNotifyVoterId,
    selectedFamilyFilter,
    setSelectedFamilyFilter,
    statusCardFilter,
    setStatusCardFilter,
    selectedPollingStationFilter,
    setSelectedPollingStationFilter,
    authState,
    currentUser,
    switchActiveUserRole,
    isSessionLocked,
    setIsSessionLocked,
    lockSession,
    authenticateWithRoleCredentials,
    firebaseUser,
    isAuthReady,
    isAuthenticated: !isSessionLocked && Boolean(firebaseUser || currentUser.active),
    isConnectedToFirestore,
    isSyncingFirestore,
    syncSeedDataToFirestore,
    loginWithGoogle,
    logoutFirebase,
    revealFullPhone,
    setRevealFullPhone,
    canEditVoter,
    canApproveExport,
    canRequestExport,
    canImportData,
    canManageUsers,
    canDeleteVoter,
    canRestoreVoter,
    canUnmaskPhone,
    villages,
    villageParts,
    pollingStations,
    scopedPollingStations,
    voters,
    allVotersIncludingDeleted: scopedAllVotersIncludingDeleted,
    families,
    scopedFamilies,
    tasks: scopedTasks,
    notes: scopedNotes,
    visits: scopedVisits,
    voterNotifications: scopedVoterNotifications,
    users,
    importBatches,
    auditLogs: scopedAuditLogs,
    exportRequests: scopedExportRequests,
    unassignedImports,
    savedFilters,
    availableTags,
    issueTypes,
    sendVoterNotification,
    sendBulkVoterNotifications,
    updateVoter,
    createVoter,
    softDeleteVoter,
    restoreVoter,
    bulkUpdateVoters,
    addNote,
    addTask,
    updateTaskStatus,
    addVisit,
    moveVoterToFamily,
    splitFamily,
    mergeFamilies,
    updatePartStationMapping,
    updatePollingStationWorkers,
    addCustomTag,
    saveCustomFilter,
    commitImportBatch,
    rollbackImportBatch,
    allocateUnassignedRecord,
    requestDataExport,
    approveOrRejectExport,
    createUser,
    toggleUserActive,
    updateUserRoleScope,
    toasts,
    addToast,
    dismissToast,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within a StoreProvider');
  return ctx;
}

export function useVoterStore() {
  return useStore();
}
