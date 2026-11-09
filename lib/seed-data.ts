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
  VoterCategory,
  VoterColorState,
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

const SURNAMES = [
  'Thokchom', 'Konjengbam', 'Yumnam', 'Laishram', 'Ningthoujam',
  'Wangkhem', 'Thounaojam', 'Keisham', 'Sanasam', 'Moirangthem',
  'Akoijam', 'Oinam', 'Khundrakpam', 'Lourembam', 'Elangbam', 'Mutum',
];

const MALE_FIRST_NAMES = [
  'Tombisana', 'Ibobi', 'Biren', 'Joykumar', 'Chaoba', 'Ranjit',
  'Doren', 'Mangibabu', 'Tomba', 'Sanatomba', 'Hemba', 'Brojen',
  'Premjit', 'Shyamkumar', 'Surjit', 'Rajesh', 'Lukhoi', 'Bikram',
  'Khumukcham', 'Noren', 'Gourahari', 'Deben', 'Mani', 'Ibohal',
];

const FEMALE_FIRST_NAMES = [
  'Ibemhal', 'Sanahanbi', 'Memcha', 'Thoibi', 'Bimala', 'Chaobi',
  'Kunjarani', 'Linthoingambi', 'Lanchenbi', 'Roshni', 'Purnima', 'Memchoubi',
  'Sanatombi', 'Bina', 'Jamuna', 'Sushila', 'Premila', 'Thaja',
  'Mema', 'Sonia', 'Priyadarshini', 'Nirmala', 'Rebika', 'ibempishak',
];

const OCCUPATIONS = [
  'Cultivator / Farmer', 'Govt. Teacher', 'Handloom Weaver', 'Small Business Owner',
  'State Govt. Employee', 'Self-Employed', 'Student', 'Retired Pensioner',
  'Healthcare Worker', 'Shopkeeper', 'Pisciculture Farmer', 'Homemaker',
];

const EDUCATIONS = ['Graduate', 'Higher Secondary (XII)', 'High School (X)', 'Post Graduate', 'Diploma', 'Primary'];

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

  // 1. Users (Super Admin, Admin/Coordinator, PS Incharges, Field Workers, Viewer)
  const users: AppUser[] = [
    {
      id: 'usr-super-admin',
      uid: 'usr-super-admin',
      name: 'Sanasam Hemba Singh',
      email: 'sanasamhembasingh@gmail.com',
      phone: '9862011234',
      role: 'Super Admin',
      pollingStationIds: ['ALL'],
      villageIds: ['ALL'],
      active: true,
      createdBy: 'usr-super-admin',
      createdAt: baseDate,
      updatedAt: baseDate,
    },
    {
      id: 'usr-coord-1',
      uid: 'usr-coord-1',
      name: 'Thokchom Joykumar Singh',
      email: 'joykumar.coord@thoubal31.org',
      phone: '9862144510',
      role: 'Admin/Coordinator',
      pollingStationIds: ['ALL'],
      villageIds: ['ALL'],
      active: true,
      createdBy: 'usr-super-admin',
      createdAt: baseDate,
      updatedAt: baseDate,
    },
    {
      id: 'usr-incharge-1',
      uid: 'usr-incharge-1',
      name: 'Laishram Doren Meitei',
      email: 'doren.ps1@thoubal31.org',
      phone: '9436021145',
      role: 'Polling Station Incharge',
      pollingStationIds: ['ps-1', 'ps-2', 'ps-3', 'ps-4', 'ps-5', 'ps-6', 'ps-7', 'ps-8', 'ps-9', 'ps-10', 'ps-11', 'ps-12', 'ps-13'],
      villageIds: ['vil-1', 'vil-2'],
      active: true,
      createdBy: 'usr-super-admin',
      createdAt: baseDate,
      updatedAt: baseDate,
    },
    {
      id: 'usr-incharge-2',
      uid: 'usr-incharge-2',
      name: 'Konjengbam Ranjit Singh',
      email: 'ranjit.ps4@thoubal31.org',
      phone: '9436088912',
      role: 'Polling Station Incharge',
      pollingStationIds: ['ps-14', 'ps-15', 'ps-16', 'ps-17', 'ps-18', 'ps-19', 'ps-20', 'ps-21', 'ps-22', 'ps-23', 'ps-24', 'ps-25'],
      villageIds: ['vil-3', 'vil-4', 'vil-5', 'vil-6', 'vil-7'],
      active: true,
      createdBy: 'usr-super-admin',
      createdAt: baseDate,
      updatedAt: baseDate,
    },
    {
      id: 'usr-worker-1',
      uid: 'usr-worker-1',
      name: 'Yumnam Sanatomba Singh',
      email: 'sanatomba.fw@thoubal31.org',
      phone: '8794123091',
      role: 'Field Worker',
      pollingStationIds: ['ps-1', 'ps-2', 'ps-3', 'ps-4', 'ps-5', 'ps-6', 'ps-7', 'ps-8', 'ps-9', 'ps-10'],
      villageIds: ['vil-1', 'vil-2'],
      active: true,
      createdBy: 'usr-super-admin',
      createdAt: baseDate,
      updatedAt: baseDate,
    },
    {
      id: 'usr-worker-2',
      uid: 'usr-worker-2',
      name: 'Ningthoujam Thoibi Devi',
      email: 'thoibi.fw@thoubal31.org',
      phone: '8794556123',
      role: 'Field Worker',
      pollingStationIds: ['ps-11', 'ps-12', 'ps-13', 'ps-14', 'ps-15', 'ps-16', 'ps-17', 'ps-18', 'ps-19', 'ps-20'],
      villageIds: ['vil-2', 'vil-3', 'vil-4', 'vil-5', 'vil-6'],
      active: true,
      createdBy: 'usr-super-admin',
      createdAt: baseDate,
      updatedAt: baseDate,
    },
    {
      id: 'usr-worker-3',
      uid: 'usr-worker-3',
      name: 'Wangkhem Brojen Singh',
      email: 'brojen.fw@thoubal31.org',
      phone: '7005129834',
      role: 'Field Worker',
      pollingStationIds: ['ps-21', 'ps-22', 'ps-23', 'ps-24', 'ps-25', 'ps-26', 'ps-27', 'ps-28', 'ps-29', 'ps-30'],
      villageIds: ['vil-6', 'vil-7', 'vil-8', 'vil-9'],
      active: true,
      createdBy: 'usr-super-admin',
      createdAt: baseDate,
      updatedAt: baseDate,
    },
    {
      id: 'usr-worker-4',
      uid: 'usr-worker-4',
      name: 'Keisham Linthoingambi Devi',
      email: 'linthoi.fw@thoubal31.org',
      phone: '7005884120',
      role: 'Field Worker',
      pollingStationIds: [
        'ps-31', 'ps-32', 'ps-33', 'ps-34', 'ps-35', 'ps-36', 'ps-37', 'ps-38', 'ps-39', 'ps-40', 'ps-41'
      ],
      villageIds: ['vil-9', 'vil-10', 'vil-11', 'vil-12', 'vil-13'],
      active: true,
      createdBy: 'usr-super-admin',
      createdAt: baseDate,
      updatedAt: baseDate,
    },
    {
      id: 'usr-viewer-1',
      uid: 'usr-viewer-1',
      name: 'Moirangthem Surjit (Analyst)',
      email: 'surjit.analyst@thoubal31.org',
      phone: '9862900112',
      role: 'Viewer',
      pollingStationIds: ['ALL'],
      villageIds: ['ALL'],
      active: true,
      createdBy: 'usr-super-admin',
      createdAt: baseDate,
      updatedAt: baseDate,
    },
  ];

  const workerList = ['usr-worker-1', 'usr-worker-2', 'usr-worker-3', 'usr-worker-4'];

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
    const inchargeId = psNo <= 13 ? 'usr-incharge-1' : psNo <= 25 ? 'usr-incharge-2' : 'usr-coord-1';

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

  // 3. Generate 82 Families and 300 Voters across all 41 Polling Stations
  const families: Family[] = [];
  const voters: Voter[] = [];
  let voterCounter = 1;

  for (let famIdx = 1; famIdx <= 82; famIdx++) {
    const vp = villageParts[(famIdx - 1) % villageParts.length];
    const village = villages.find((v) => v.id === vp.villageId)!;
    const ps = pollingStations.find((p) => p.id === vp.pollingStationId)!;

    const surname = SURNAMES[(famIdx - 1) % SURNAMES.length];
    const familyId = `fam-${String(famIdx).padStart(3, '0')}`;
    const familyCode = `THB-FAM-${String(famIdx).padStart(4, '0')}`;
    const houseNo = `H.No. ${(famIdx * 7) % 240 + 12}/${(famIdx % 4) + 1}`;
    const addressLine = `${houseNo}, ${vp.name}, ${village.name}, Thoubal - 795138`;

    // 54 families of 4 (216) + 28 families of 3 (84) => exactly 300 voters!
    const memberCount = famIdx <= 54 ? 4 : 3;

    const fatherFirstName = MALE_FIRST_NAMES[(famIdx * 3) % MALE_FIRST_NAMES.length];
    const motherFirstName = FEMALE_FIRST_NAMES[(famIdx * 3) % FEMALE_FIRST_NAMES.length];
    const grandpaFirstName = MALE_FIRST_NAMES[(famIdx * 3 + 7) % MALE_FIRST_NAMES.length];
    const grandmaFirstName = FEMALE_FIRST_NAMES[(famIdx * 3 + 5) % FEMALE_FIRST_NAMES.length];

    const headFullName = `${surname} ${fatherFirstName} Singh`;
    const spouseFullName = `${surname} ${motherFirstName} Devi`;
    const grandpaFullName = `${surname} ${grandpaFirstName} Singh`;
    const grandmaFullName = `${surname} ${grandmaFirstName} Devi`;

    const headVoterId = `vot-${String(voterCounter).padStart(4, '0')}`;
    const spouseVoterId = `vot-${String(voterCounter + 1).padStart(4, '0')}`;

    const familyVoters: Voter[] = [];

    for (let m = 0; m < memberCount; m++) {
      const vNum = voterCounter++;
      const vId = `vot-${String(vNum).padStart(4, '0')}`;
      const epicPrefix = vNum % 3 === 0 ? 'MNP' : vNum % 3 === 1 ? 'THB' : 'imp'.toUpperCase();
      const epicNo = `${epicPrefix}${String(1042000 + vNum * 13).slice(0, 7)}`;

      let name = '';
      let gender: 'M' | 'F' = 'M';
      let age = 48;
      let fatherName = grandpaFullName;
      let motherName = grandmaFullName;
      let spouseName = '';
      let linkedSpouseId: string | undefined = undefined;
      let relationToHead: Voter['relationToHead'] = 'Head';

      if (m === 0) {
        name = headFullName;
        gender = 'M';
        age = 46 + (famIdx % 28);
        fatherName = grandpaFullName;
        motherName = grandmaFullName;
        spouseName = spouseFullName;
        linkedSpouseId = spouseVoterId;
        relationToHead = 'Head';
      } else if (m === 1) {
        name = spouseFullName;
        gender = 'F';
        age = 42 + (famIdx % 26);
        fatherName = `${SURNAMES[(famIdx + 4) % SURNAMES.length]} Ibohal Singh`;
        motherName = `${SURNAMES[(famIdx + 4) % SURNAMES.length]} Jamuna Devi`;
        spouseName = headFullName;
        linkedSpouseId = headVoterId;
        relationToHead = 'Spouse';
      } else if (m === 2) {
        const isSon = (famIdx + m) % 2 === 0;
        const childFirst = isSon
          ? MALE_FIRST_NAMES[(famIdx * 5 + 2) % MALE_FIRST_NAMES.length]
          : FEMALE_FIRST_NAMES[(famIdx * 5 + 2) % FEMALE_FIRST_NAMES.length];
        name = `${surname} ${childFirst} ${isSon ? 'Singh' : 'Devi'}`;
        gender = isSon ? 'M' : 'F';
        age = 18 + (famIdx % 14);
        fatherName = headFullName;
        motherName = spouseFullName;
        spouseName = '';
        relationToHead = isSon ? 'Son' : 'Daughter';
      } else {
        const isSon2 = (famIdx + m) % 2 === 1;
        const child2First = isSon2
          ? MALE_FIRST_NAMES[(famIdx * 7 + 4) % MALE_FIRST_NAMES.length]
          : FEMALE_FIRST_NAMES[(famIdx * 7 + 4) % FEMALE_FIRST_NAMES.length];
        name = `${surname} ${child2First} ${isSon2 ? 'Singh' : 'Devi'}`;
        gender = isSon2 ? 'M' : 'F';
        age = 19 + (famIdx % 11);
        fatherName = headFullName;
        motherName = spouseFullName;
        spouseName = '';
        relationToHead = isSon2 ? 'Son' : 'Daughter';
      }

      // Deterministic status distribution across 300 voters:
      // ~165 Verified, ~72 Pending, ~33 Issues, ~30 New
      let status: VoterStatus = 'Verified';
      let issueType: IssueType | undefined = undefined;
      let importBatchId: string | undefined = undefined;

      const mod20 = vNum % 20;
      if (mod20 <= 10) {
        status = 'Verified';
      } else if (mod20 <= 15) {
        status = 'Pending';
      } else if (mod20 <= 17) {
        status = 'Issues';
        issueType = ISSUE_TYPES[vNum % ISSUE_TYPES.length];
      } else {
        status = 'New';
        importBatchId = 'batch-initial-2026';
      }

      // Deterministic VoterCategory & Voter Color State distribution:
      // Voter / Our Voter (~45%), Pending / Pending Voter (~25%), Opponent / Opponent Voter (~20%), Worker / Worker Voter (~10%)
      let category: VoterCategory = VoterCategory.Pending;
      let colorState: VoterColorState = 'Pending Voter';
      const colorMod = (vNum * 7 + famIdx) % 20;
      if (colorMod <= 8) {
        category = VoterCategory.Voter;
        colorState = 'Our Voter';
      } else if (colorMod <= 13) {
        category = VoterCategory.Pending;
        colorState = 'Pending Voter';
      } else if (colorMod <= 17) {
        category = VoterCategory.Opponent;
        colorState = 'Opponent Voter';
      } else {
        category = VoterCategory.Worker;
        colorState = 'Worker Voter';
      }

      const tags: string[] = [];
      if (age >= 70) tags.push('Senior Citizen');
      if (age >= 18 && age <= 21) tags.push('First-Time Voter');
      if (m === 0 && famIdx % 5 === 0) tags.push('Key Household');
      if (status === 'Verified') tags.push('Verified Phone');

      const phoneNum = `9862${String(100000 + vNum * 271).slice(0, 6)}`;
      const assignedWorkerId = ps.workerIds[0] || 'usr-worker-1';

      const voter: Voter = {
        id: vId,
        epicNo,
        name,
        nameLocal: `${surname} (${vp.name.split(' ')[0]})`,
        fatherName,
        motherName,
        spouseName: spouseName || undefined,
        spouseVoterId: linkedSpouseId,
        relationToHead,
        age,
        dob: `${2026 - age}-0${(vNum % 8) + 1}-1${vNum % 9}`,
        gender,
        phone: phoneNum,
        alternatePhone: m === 0 ? `9436${String(200000 + famIdx * 313).slice(0, 6)}` : undefined,
        occupation: OCCUPATIONS[vNum % OCCUPATIONS.length],
        education: EDUCATIONS[vNum % EDUCATIONS.length],
        rationCardNo: `MN-THB-00${1200 + famIdx}`,
        specialNeeds: age >= 80 ? 'Elderly (80+)' : vNum % 47 === 0 ? 'PwD' : 'None',
        contactPreference: vNum % 3 === 0 ? 'WhatsApp' : 'Phone',
        familyId,
        partNo: vp.partNo,
        serialNo: vNum,
        villageId: village.id,
        villagePartId: vp.id,
        pollingStationId: ps.id,
        addressId: addressLine,
        houseNo,
        lat: Number((ps.lat + ((famIdx % 7) - 3) * 0.0004).toFixed(5)),
        lng: Number((ps.lng + ((famIdx % 5) - 2) * 0.0004).toFixed(5)),
        gpsAccuracyMeters: 4 + (vNum % 8),
        status,
        category,
        colorState,
        issueType,
        tags,
        assignedWorkerId,
        importBatchId,
        isDeleted: false,
        createdBy: 'usr-super-admin',
        createdAt: baseDate,
        updatedAt: `2026-10-${String(16 + (vNum % 10)).padStart(2, '0')}T1${vNum % 9}:30:00.000Z`,
      };

      voters.push(voter);
      familyVoters.push(voter);
    }

    const verifiedInFam = familyVoters.filter((v) => v.status === 'Verified').length;
    families.push({
      id: familyId,
      familyCode,
      headVoterId,
      headName: headFullName,
      villageId: village.id,
      villagePartId: vp.id,
      pollingStationId: ps.id,
      address: addressLine,
      statusRollup: `${verifiedInFam}/${familyVoters.length} Verified`,
      createdBy: 'usr-super-admin',
      createdAt: baseDate,
      updatedAt: baseDate,
    });
  }

  // 4. Sample Notes, Tasks, Visits
  const notes: VoterNote[] = [
    {
      id: 'note-1',
      voterId: 'vot-0001',
      pollingStationId: voters[0].pollingStationId,
      content: 'Household visited and EPIC card cross-checked with original Aadhaar and Electoral Roll Part 1. @Thokchom Joykumar Singh confirmed all 4 members reside at H.No. 19/2.',
      authorName: 'Yumnam Sanatomba Singh',
      createdBy: 'usr-worker-1',
      createdAt: '2026-10-22T10:15:00.000Z',
    },
    {
      id: 'note-2',
      voterId: 'vot-0016',
      pollingStationId: voters[15].pollingStationId,
      content: 'Spouse name spelling on electoral roll has "Debi" instead of "Devi". Flagged for Bloch Level Officer correction form.',
      authorName: 'Ningthoujam Thoibi Devi',
      createdBy: 'usr-worker-2',
      createdAt: '2026-10-23T14:20:00.000Z',
    },
    {
      id: 'note-3',
      voterId: 'vot-0017',
      pollingStationId: voters[16].pollingStationId,
      content: 'Neighbor confirmed voter shifted to Imphal East after marriage. Needs Form-7 verification with Booth Incharge.',
      authorName: 'Laishram Doren Meitei',
      createdBy: 'usr-incharge-1',
      createdAt: '2026-10-24T11:05:00.000Z',
    },
    {
      id: 'note-4',
      voterId: 'vot-0002',
      pollingStationId: voters[1].pollingStationId,
      content: 'Phone number verified via call. Requested voter slip delivery before polling day.',
      authorName: 'Yumnam Sanatomba Singh',
      createdBy: 'usr-worker-1',
      createdAt: '2026-10-25T09:40:00.000Z',
    },
  ];

  const tasks: VoterTask[] = [
    {
      id: 'tsk-1',
      voterId: 'vot-0016',
      familyId: voters[15].familyId,
      pollingStationId: voters[15].pollingStationId,
      title: 'Collect Form-8 supporting document for name correction',
      type: 'Issue Resolution',
      assigneeId: 'usr-worker-2',
      dueDate: '2026-10-25',
      priority: 'High',
      status: 'Overdue',
      createdBy: 'usr-coord-1',
      createdAt: '2026-10-20T09:00:00.000Z',
      updatedAt: '2026-10-25T09:00:00.000Z',
    },
    {
      id: 'tsk-2',
      voterId: 'vot-0012',
      familyId: voters[11].familyId,
      pollingStationId: voters[11].pollingStationId,
      title: 'Verify pending household members during afternoon leikai visit',
      type: 'Verification',
      assigneeId: 'usr-worker-1',
      dueDate: '2026-10-28',
      priority: 'Medium',
      status: 'Scheduled',
      createdBy: 'usr-incharge-1',
      createdAt: '2026-10-23T11:00:00.000Z',
      updatedAt: '2026-10-23T11:00:00.000Z',
    },
    {
      id: 'tsk-3',
      voterId: 'vot-0001',
      familyId: voters[0].familyId,
      pollingStationId: voters[0].pollingStationId,
      title: 'Schedule community meeting with Thokchom Awang Leikai elders',
      type: 'Meeting',
      assigneeId: 'usr-worker-1',
      dueDate: '2026-10-29',
      priority: 'High',
      status: 'Pending',
      createdBy: 'usr-super-admin',
      createdAt: '2026-10-24T15:30:00.000Z',
      updatedAt: '2026-10-24T15:30:00.000Z',
    },
    {
      id: 'tsk-4',
      voterId: 'vot-0017',
      familyId: voters[16].familyId,
      pollingStationId: voters[16].pollingStationId,
      title: 'Confirm shifted address & obtain head of family signature',
      type: 'Issue Resolution',
      assigneeId: 'usr-worker-3',
      dueDate: '2026-10-24',
      priority: 'High',
      status: 'Overdue',
      createdBy: 'usr-coord-1',
      createdAt: '2026-10-19T10:00:00.000Z',
      updatedAt: '2026-10-24T10:00:00.000Z',
    },
    {
      id: 'tsk-5',
      voterId: 'vot-0018',
      familyId: voters[17].familyId,
      pollingStationId: voters[17].pollingStationId,
      title: 'Initial verification of newly imported ECI supplemental roll voter',
      type: 'Verification',
      assigneeId: 'usr-worker-2',
      dueDate: '2026-10-30',
      priority: 'Medium',
      status: 'Pending',
      createdBy: 'usr-coord-1',
      createdAt: '2026-10-25T16:00:00.000Z',
      updatedAt: '2026-10-25T16:00:00.000Z',
    },
  ];

  const visits: VoterVisit[] = [
    {
      id: 'vis-1',
      voterId: 'vot-0001',
      pollingStationId: voters[0].pollingStationId,
      outcome: 'Met Head of Family Thokchom Joykumar Singh; verified all 4 EPIC numbers on site.',
      lat: 24.6384,
      lng: 94.0015,
      createdBy: 'usr-worker-1',
      createdAt: '2026-10-22T10:12:00.000Z',
    },
    {
      id: 'vis-2',
      voterId: 'vot-0016',
      pollingStationId: voters[15].pollingStationId,
      outcome: 'Visited household; identified spelling mismatch on electoral roll and logged issue.',
      lat: 24.6348,
      lng: 94.0082,
      createdBy: 'usr-worker-2',
      createdAt: '2026-10-23T14:15:00.000Z',
    },
  ];

  const importBatches: ImportBatch[] = [
    {
      id: 'batch-master-2026',
      fileName: 'AC31_Thoubal_MotherRoll_2026_Parts1to41.xlsx',
      totalRows: 270,
      validRows: 270,
      errorRows: 0,
      unassignedRows: 0,
      status: 'Completed',
      createdBy: 'usr-super-admin',
      createdAt: '2026-10-15T09:00:00.000Z',
      updatedAt: '2026-10-15T09:05:00.000Z',
    },
    {
      id: 'batch-initial-2026',
      fileName: 'AC31_Thoubal_Supplemental_Additions_Oct2026.csv',
      totalRows: 34,
      validRows: 30,
      errorRows: 3,
      unassignedRows: 1,
      status: 'Completed',
      createdBy: 'usr-coord-1',
      createdAt: '2026-10-24T11:30:00.000Z',
      updatedAt: '2026-10-24T11:32:00.000Z',
    },
  ];

  const exportRequests: ExportRequest[] = [
    {
      id: 'exp-1',
      scopeDescription: 'PS 1–6 (Moijing Area) Verified & Pending Roster',
      recordCount: 36,
      reason: 'Field verification printed sheets for booth incharge Laishram Doren Meitei',
      status: 'Pending Approval',
      requesterName: 'Laishram Doren Meitei',
      createdBy: 'usr-incharge-1',
      createdAt: '2026-10-26T08:15:00.000Z',
      updatedAt: '2026-10-26T08:15:00.000Z',
    },
    {
      id: 'exp-2',
      scopeDescription: 'All 41 Polling Stations Summary & Issue List',
      recordCount: 300,
      reason: 'Weekly constituency review meeting with Coordinator',
      status: 'Approved',
      requesterName: 'Thokchom Joykumar Singh',
      approvedBy: 'Sanasam Hemba Singh',
      createdBy: 'usr-coord-1',
      createdAt: '2026-10-24T17:00:00.000Z',
      updatedAt: '2026-10-24T17:20:00.000Z',
    },
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'aud-1',
      entity: 'ImportBatch',
      entityId: 'batch-master-2026',
      action: 'IMPORT',
      field: 'status',
      oldValue: 'None',
      newValue: 'Imported 270 voters across PS 1–41 (AC31_Thoubal_MotherRoll_2026_Parts1to41.xlsx)',
      userName: 'Sanasam Hemba Singh',
      userRole: 'Super Admin',
      createdBy: 'usr-super-admin',
      createdAt: '2026-10-15T09:05:00.000Z',
    },
    {
      id: 'aud-2',
      entity: 'Voter',
      entityId: 'vot-0001',
      action: 'STATUS_CHANGE',
      field: 'status',
      oldValue: 'Pending',
      newValue: 'Verified',
      userName: 'Yumnam Sanatomba Singh',
      userRole: 'Field Worker',
      gps: '24.6384, 94.0015',
      createdBy: 'usr-worker-1',
      createdAt: '2026-10-22T10:15:00.000Z',
    },
    {
      id: 'aud-3',
      entity: 'Voter',
      entityId: 'vot-0016',
      action: 'STATUS_CHANGE',
      field: 'status',
      oldValue: 'Pending',
      newValue: 'Issues (Duplicate / Name mismatch)',
      userName: 'Ningthoujam Thoibi Devi',
      userRole: 'Field Worker',
      gps: '24.6348, 94.0082',
      createdBy: 'usr-worker-2',
      createdAt: '2026-10-23T14:20:00.000Z',
    },
    {
      id: 'aud-4',
      entity: 'ImportBatch',
      entityId: 'batch-initial-2026',
      action: 'IMPORT',
      field: 'status',
      oldValue: 'None',
      newValue: 'Imported 30 new voters (AC31_Thoubal_Supplemental_Additions_Oct2026.csv)',
      userName: 'Thokchom Joykumar Singh',
      userRole: 'Admin/Coordinator',
      createdBy: 'usr-coord-1',
      createdAt: '2026-10-24T11:32:00.000Z',
    },
    {
      id: 'aud-5',
      entity: 'ExportRequest',
      entityId: 'exp-2',
      action: 'EXPORT_APPROVE',
      field: 'status',
      oldValue: 'Pending Approval',
      newValue: 'Approved (Watermarked CSV generated)',
      userName: 'Sanasam Hemba Singh',
      userRole: 'Super Admin',
      createdBy: 'usr-super-admin',
      createdAt: '2026-10-24T17:20:00.000Z',
    },
  ];

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

  const voterNotifications: VoterNotification[] = [
    {
      id: 'notif-1',
      voterId: voters[0].id,
      voterName: voters[0].name,
      epicNo: voters[0].epicNo,
      phone: voters[0].phone,
      pollingStationId: voters[0].pollingStationId,
      channel: 'WhatsApp',
      templateType: 'Polling Slip',
      subject: `Digital Voter Slip · ${voters[0].epicNo}`,
      message: `Hello ${voters[0].name}, your AC-31 Thoubal Electoral Roll entry is verified. EPIC: ${voters[0].epicNo}, Part No: ${voters[0].partNo}, Serial No: ${voters[0].serialNo}, Polling Station: PS-${voters[0].partNo}.`,
      status: 'Read',
      sentByName: 'Sanasam Hemba Singh',
      createdBy: 'usr-super-admin',
      createdAt: '2026-10-25T10:30:00.000Z',
    },
    {
      id: 'notif-2',
      voterId: voters[1].id,
      voterName: voters[1].name,
      epicNo: voters[1].epicNo,
      phone: voters[1].phone,
      pollingStationId: voters[1].pollingStationId,
      channel: 'SMS',
      templateType: 'Polling Slip',
      subject: `Digital Voter Slip · ${voters[1].epicNo}`,
      message: `AC-31 Thoubal Voter Slip: ${voters[1].name} (EPIC: ${voters[1].epicNo}), Part ${voters[1].partNo}, Sl.No ${voters[1].serialNo}, Booth PS-${voters[1].partNo}.`,
      status: 'Delivered',
      sentByName: 'Yumnam Sanatomba Singh',
      createdBy: 'usr-worker-1',
      createdAt: '2026-10-25T11:15:00.000Z',
    },
    {
      id: 'notif-3',
      voterId: voters[11].id,
      voterName: voters[11].name,
      epicNo: voters[11].epicNo,
      phone: voters[11].phone,
      pollingStationId: voters[11].pollingStationId,
      channel: 'SMS',
      templateType: 'Verification Reminder',
      subject: `Field Verification Visit · ${voters[11].epicNo}`,
      message: `Dear ${voters[11].name}, our booth verification worker will visit your household in Part ${voters[11].partNo} to confirm EPIC ${voters[11].epicNo}. Please keep your EPIC card ready.`,
      status: 'Delivered',
      sentByName: 'Laishram Doren Meitei',
      createdBy: 'usr-incharge-1',
      createdAt: '2026-10-26T09:20:00.000Z',
    },
    {
      id: 'notif-4',
      voterId: voters[15].id,
      voterName: voters[15].name,
      epicNo: voters[15].epicNo,
      phone: voters[15].phone,
      pollingStationId: voters[15].pollingStationId,
      channel: 'WhatsApp',
      templateType: 'Verification Reminder',
      subject: `Roll Correction Follow-up · ${voters[15].epicNo}`,
      message: `Dear ${voters[15].name}, please share supporting ID proof with your booth worker to resolve the electoral roll entry for EPIC ${voters[15].epicNo} at PS-${voters[15].partNo}.`,
      status: 'Sent',
      sentByName: 'Ningthoujam Thoibi Devi',
      createdBy: 'usr-worker-2',
      createdAt: '2026-10-26T14:05:00.000Z',
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
