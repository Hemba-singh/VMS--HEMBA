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
  VoterStatus,
  IssueType,
  SavedFilter,
  VoterNotification,
} from './types';

export interface SeedDatabase {
  villages: Village[];
  villageParts: VillagePart[];
  pollingStations: PollingStation[];
  users: AppUser[];
  families: Family[];
  voters: Voter[];
  tasks: VoterTask[];
  notes: VoterNote[];
  visits: VoterVisit[];
  voterNotifications: VoterNotification[];
  importBatches: ImportBatch[];
  auditLogs: AuditLog[];
  exportRequests: ExportRequest[];
  savedFilters: SavedFilter[];
  availableTags: string[];
  issueTypes: IssueType[];
  statuses: VoterStatus[];
}

const VILLAGE_DEFINITIONS = [
  { id: 'vil-1', code: 'THB-V01', name: 'Moijing', lat: 24.6235, lng: 93.9875 },
  { id: 'vil-2', code: 'THB-V02', name: 'Leishangthem', lat: 24.6310, lng: 93.9940 },
  { id: 'vil-3', code: 'THB-V03', name: 'Thoudam', lat: 24.6262, lng: 94.0012 },
  { id: 'vil-4', code: 'THB-V04', name: 'Nongangkhong', lat: 24.6322, lng: 94.0048 },
  { id: 'vil-5', code: 'THB-V05', name: 'Okram Wangmataba', lat: 24.6358, lng: 94.0115 },
  { id: 'vil-6', code: 'THB-V06', name: 'Thoubal Wangmataba', lat: 24.6398, lng: 94.0165 },
  { id: 'vil-7', code: 'THB-V07', name: 'Sabaltongba', lat: 24.6432, lng: 94.0212 },
  { id: 'vil-8', code: 'THB-V08', name: 'Ningombam', lat: 24.6346, lng: 93.9988 },
  { id: 'vil-9', code: 'THB-V09', name: 'Okram Hanjaba', lat: 24.6378, lng: 94.0048 },
  { id: 'vil-10', code: 'THB-V10', name: 'Thoubal Kiyam', lat: 24.6182, lng: 94.0088 },
  { id: 'vil-11', code: 'THB-V11', name: 'Thoubal Achouba', lat: 24.6410, lng: 94.0026 },
  { id: 'vil-12', code: 'THB-V12', name: 'Athokpam', lat: 24.6475, lng: 93.9995 },
  { id: 'vil-13', code: 'THB-V13', name: 'Thoubal Melaground & Bazar', lat: 24.6375, lng: 94.0080 },
];

interface OfficialStationSpec {
  psNo: number;
  partName: string;
  building: string;
  villageId: string;
  lat: number;
  lng: number;
}

const OFFICIAL_THOUBAL_STATIONS: OfficialStationSpec[] = [
  // Moijing (Parts 1–6)
  { psNo: 1, partName: 'Moijing Leingoijil', building: 'The Leingoijil Community Hall', villageId: 'vil-1', lat: 24.6212, lng: 93.9845 },
  { psNo: 2, partName: 'Moijing Thoubalmayum Leikai', building: 'Moijing High School', villageId: 'vil-1', lat: 24.6225, lng: 93.9858 },
  { psNo: 3, partName: 'Moijing Awang Leikai', building: 'Moijing Community Hall', villageId: 'vil-1', lat: 24.6241, lng: 93.9870 },
  { psNo: 4, partName: 'Moijing Awang Mamang Leikai', building: 'Moijing Awang Primary Madrassa School', villageId: 'vil-1', lat: 24.6256, lng: 93.9882 },
  { psNo: 5, partName: 'Moijing Wangmataba Makha Leikai', building: 'Moijing Wangmataba Community Hall', villageId: 'vil-1', lat: 24.6238, lng: 93.9895 },
  { psNo: 6, partName: 'Moijing Wangmataba', building: 'Moijing Upper Primary School', villageId: 'vil-1', lat: 24.6248, lng: 93.9910 },

  // Leishangthem (Parts 7–13)
  { psNo: 7, partName: 'Leishangthem (A)', building: 'T.M.K. English School (East Wing)', villageId: 'vil-2', lat: 24.6288, lng: 93.9915 },
  { psNo: 8, partName: 'Leishangthem (B)', building: 'T.M.K. English School (West Wing)', villageId: 'vil-2', lat: 24.6292, lng: 93.9922 },
  { psNo: 9, partName: 'Leishangthem Khongmanung Maning Leikai', building: 'Leishangthem Khongmanung L.P. School', villageId: 'vil-2', lat: 24.6305, lng: 93.9930 },
  { psNo: 10, partName: 'Leishangthem Keli Makhong (A)', building: 'Leishangthem Keli Makhong Upper Primary School (East Wing)', villageId: 'vil-2', lat: 24.6318, lng: 93.9942 },
  { psNo: 11, partName: 'Leishangthem Keli Makhong (B)', building: 'Leishangthem Keli Makhong Upper Primary School (West Wing)', villageId: 'vil-2', lat: 24.6322, lng: 93.9948 },
  { psNo: 12, partName: 'Leishangthem Wangmataba (A)', building: 'Thoudam Leishangthem High School (North Wing)', villageId: 'vil-2', lat: 24.6335, lng: 93.9960 },
  { psNo: 13, partName: 'Leishangthem Wangmataba (B)', building: 'Leishangthem Wangmataba Upper Primary School', villageId: 'vil-2', lat: 24.6341, lng: 93.9968 },

  // Thoudam (Part 14)
  { psNo: 14, partName: 'Thoudam Thokchom', building: 'Thoudam Junior High School', villageId: 'vil-3', lat: 24.6262, lng: 94.0012 },

  // Nongangkhong (Parts 15–17)
  { psNo: 15, partName: 'Nongangkhong (A)', building: 'Nongangkhong Primary School (North Wing)', villageId: 'vil-4', lat: 24.6315, lng: 94.0040 },
  { psNo: 16, partName: 'Nongangkhong (B)', building: 'Nongangkhong Primary School (South Wing)', villageId: 'vil-4', lat: 24.6322, lng: 94.0048 },
  { psNo: 17, partName: 'Nongangkhong (C)', building: 'Nongangkhong Community Hall', villageId: 'vil-4', lat: 24.6330, lng: 94.0055 },

  // Okram Wangmataba (Parts 18–19)
  { psNo: 18, partName: 'Okram Wangmataba (A)', building: 'Okram Wangmataba Boys L.P. School (East Wing)', villageId: 'vil-5', lat: 24.6355, lng: 94.0112 },
  { psNo: 19, partName: 'Okram Wangmataba (B)', building: 'Okram Wangmataba Boys L.P. School (West Wing)', villageId: 'vil-5', lat: 24.6362, lng: 94.0118 },

  // Thoubal Wangmataba (Parts 20–22)
  { psNo: 20, partName: 'Thoubal Wangmataba (A)', building: 'Thoubal Wangmataba Boys L.P. School', villageId: 'vil-6', lat: 24.6388, lng: 94.0152 },
  { psNo: 21, partName: 'Thoubal Wangmataba (B)', building: 'Keiranbi L.P. School', villageId: 'vil-6', lat: 24.6398, lng: 94.0165 },
  { psNo: 22, partName: 'Thoubal Wangmataba (C)', building: 'Manishang Girls L.P. School', villageId: 'vil-6', lat: 24.6408, lng: 94.0175 },

  // Sabaltongba (Parts 23–25)
  { psNo: 23, partName: 'Sabaltongba (A)', building: 'Sabaltongba Primary School (East Wing)', villageId: 'vil-7', lat: 24.6425, lng: 94.0205 },
  { psNo: 24, partName: 'Sabaltongba (B)', building: 'Sabaltongba Primary School (West Wing)', villageId: 'vil-7', lat: 24.6432, lng: 94.0212 },
  { psNo: 25, partName: 'Sabaltongba (C)', building: 'Sabaltongba Community Hall', villageId: 'vil-7', lat: 24.6440, lng: 94.0220 },

  // Ningombam (Parts 26–29)
  { psNo: 26, partName: 'Ningombam Leikai (A)', building: 'Ningombam Primary School (West Wing)', villageId: 'vil-8', lat: 24.6335, lng: 93.9978 },
  { psNo: 27, partName: 'Ningombam Leikai (B)', building: 'Ningombam Primary School (East Wing)', villageId: 'vil-8', lat: 24.6342, lng: 93.9985 },
  { psNo: 28, partName: 'Ningombam Leikai (C)', building: 'Ningombam Junior High School (North Wing)', villageId: 'vil-8', lat: 24.6350, lng: 93.9992 },
  { psNo: 29, partName: 'Ningombam Leikai (D)', building: 'Ningombam Junior High School (South Wing)', villageId: 'vil-8', lat: 24.6358, lng: 93.9998 },

  // Okram Hanjaba (Parts 30–31)
  { psNo: 30, partName: 'Okram Hanjaba (A)', building: 'Okram Hanjaba Primary School (North Wing)', villageId: 'vil-9', lat: 24.6375, lng: 94.0045 },
  { psNo: 31, partName: 'Okram Hanjaba (B)', building: 'Okram Hanjaba Community Hall', villageId: 'vil-9', lat: 24.6382, lng: 94.0052 },

  // Thoubal Kiyam (Part 32)
  { psNo: 32, partName: 'Thoubal Kiyam Siphai', building: 'Thoubal Kiyam Siphai Upper Primary School', villageId: 'vil-10', lat: 24.6182, lng: 94.0088 },

  // Thoubal Achouba (Parts 33–37)
  { psNo: 33, partName: 'Thoubal Achouba Awang Leikai (A)', building: 'Thoubal Leitanthem Kanhai Junior High School (North Wing)', villageId: 'vil-11', lat: 24.6402, lng: 94.0015 },
  { psNo: 34, partName: 'Thoubal Achouba Awang Leikai (B)', building: 'Thoubal Leitanthem Kanhai Junior High School (South Wing)', villageId: 'vil-11', lat: 24.6410, lng: 94.0022 },
  { psNo: 35, partName: 'Thoubal Achouba (A)', building: 'Chaoyaima Higher Secondary School (East Wing)', villageId: 'vil-11', lat: 24.6418, lng: 94.0030 },
  { psNo: 36, partName: 'Thoubal Achouba (B)', building: 'Chaoyaima Higher Secondary School (West Wing)', villageId: 'vil-11', lat: 24.6425, lng: 94.0038 },
  { psNo: 37, partName: 'Thoubal Achouba Makha Leikai', building: 'Thoubal Achouba Community Hall', villageId: 'vil-11', lat: 24.6395, lng: 94.0028 },

  // Athokpam (Parts 38–40)
  { psNo: 38, partName: 'Athokpam Town (Portion A)', building: 'Athokpam Junior High School (East Wing)', villageId: 'vil-12', lat: 24.6475, lng: 93.9985 },
  { psNo: 39, partName: 'Athokpam Town (Portion B)', building: 'Athokpam Junior High School (West Wing)', villageId: 'vil-12', lat: 24.6485, lng: 93.9995 },
  { psNo: 40, partName: 'Athokpam Makha Leikai', building: 'Athokpam Upper Primary School', villageId: 'vil-12', lat: 24.6465, lng: 94.0005 },

  // Thoubal Melaground & Bazar (Part 41)
  { psNo: 41, partName: 'Thoubal Melaground & Bazar', building: 'Thoubal Municipal Council Multi-Purpose Hall', villageId: 'vil-13', lat: 24.6375, lng: 94.0080 },
];

const TAG_POOL = [
  'Senior Citizen', 'First-Time Voter', 'Youth Leader', 'Self-Help Group',
  'Key Household', 'Needs Assistance', 'Outstation Worker', 'Verified Phone',
];

const ISSUE_TYPES: IssueType[] = [
  'Duplicate',
  'Deceased',
  'Shifted/Migrated',
  'Wrong address',
  'Missing data',
  'Name mismatch',
  'Other',
];

export function generateSeedData(): SeedDatabase {
  const baseDate = '2026-10-15T09:00:00.000Z';

  // 1. Single Primary Super Admin Account (creates and manages all other accounts)
  const users: AppUser[] = [
    {
      id: 'usr-super-admin',
      uid: 'usr-super-admin',
      name: 'Suresh Sanasam',
      email: 'sureshsanasam13110@gmail.com',
      phone: '9862011234',
      password: 'Admin@suresh26',
      pin: '2026',
      role: 'Super Admin',
      pollingStationIds: ['ALL'],
      villageIds: ['ALL'],
      active: true,
      createdBy: 'usr-super-admin',
      createdAt: baseDate,
      updatedAt: baseDate,
    },
  ];

  const workerList = ['usr-super-admin'];

  // 2. Villages, 41 Village Parts, and 41 Polling Stations
  const villages: Village[] = [];
  const villageParts: VillagePart[] = [];
  const pollingStations: PollingStation[] = [];

  for (const vDef of VILLAGE_DEFINITIONS) {
    villages.push({
      id: vDef.id,
      code: vDef.code,
      name: vDef.name,
      lat: vDef.lat,
      lng: vDef.lng,
      createdBy: 'usr-super-admin',
      createdAt: baseDate,
      updatedAt: baseDate,
    });
  }

  for (let i = 0; i < OFFICIAL_THOUBAL_STATIONS.length; i++) {
    const spec = OFFICIAL_THOUBAL_STATIONS[i];
    const psNo = spec.psNo;
    const vpId = `vp-${psNo}`;
    const psId = `ps-${psNo}`;
    const village = villages.find((v) => v.id === spec.villageId)!;

    villageParts.push({
      id: vpId,
      code: `${village.code}-P${psNo}`,
      name: spec.partName,
      villageId: spec.villageId,
      pollingStationId: psId,
      partNo: psNo,
      createdBy: 'usr-super-admin',
      createdAt: baseDate,
      updatedAt: baseDate,
    });

    const assignedWorker = workerList[(psNo - 1) % workerList.length];
    const inchargeId = 'usr-super-admin';

    pollingStations.push({
      id: psId,
      psNo,
      name: `31/${psNo} ${spec.partName}`,
      location: `${spec.building}, ${spec.partName}, Thoubal`,
      lat: spec.lat,
      lng: spec.lng,
      partNos: [psNo],
      inchargeId,
      workerIds: [assignedWorker],
      createdBy: 'usr-super-admin',
      createdAt: baseDate,
      updatedAt: baseDate,
    });
  }

  // 3. Clean Slate Operational Collections (No Mock/Demo Data)
  const families: Family[] = [];
  const voters: Voter[] = [];
  const notes: VoterNote[] = [];
  const tasks: VoterTask[] = [];
  const visits: VoterVisit[] = [];
  const importBatches: ImportBatch[] = [];
  const exportRequests: ExportRequest[] = [];
  const auditLogs: AuditLog[] = [];
  const voterNotifications: VoterNotification[] = [];

  const savedFilters: SavedFilter[] = [
    {
      id: 'sf-first-time',
      name: 'First-Time Voters (18–21)',
      minAge: 18,
      maxAge: 21,
    },
    {
      id: 'sf-seniors',
      name: 'Senior Citizens (70+)',
      minAge: 70,
    },
    {
      id: 'sf-ps12-unverified',
      name: 'Unverified in PS 12',
      pollingStationIds: ['ps-12'],
      status: 'Pending',
    },
    {
      id: 'sf-issues-all',
      name: 'Open Electoral Roll Issues',
      status: 'Issues',
    },
  ];

  return {
    villages,
    villageParts,
    pollingStations,
    users,
    families,
    voters,
    tasks,
    notes,
    visits,
    voterNotifications,
    importBatches,
    auditLogs,
    exportRequests,
    savedFilters,
    availableTags: TAG_POOL,
    issueTypes: ISSUE_TYPES,
    statuses: ['Verified', 'Pending', 'Issues', 'New', 'Removed'],
  };
}
