export type VoterStatus = 'Verified' | 'Pending' | 'Issues' | 'New' | 'Removed';

export enum VoterCategory {
  Voter = 'Voter',
  Opponent = 'Opponent',
  Pending = 'Pending',
  Worker = 'Worker',
}

export type VoterColorState = 'Our Voter' | 'Opponent Voter' | 'Pending Voter' | 'Worker Voter';

export type IssueType =
  | 'Duplicate'
  | 'Deceased'
  | 'Shifted/Migrated'
  | 'Wrong address'
  | 'Missing data'
  | 'Name mismatch'
  | 'Other';

export type UserRole =
  | 'Super Admin'
  | 'Admin/Coordinator'
  | 'Polling Station Incharge'
  | 'Field Worker'
  | 'Viewer';

export type Gender = 'M' | 'F' | 'O';

export interface Voter {
  id: string;
  epicNo: string;
  name: string;
  nameLocal?: string;
  fatherName: string;
  motherName: string;
  spouseName?: string;
  spouseVoterId?: string;
  relationToHead?: 'Head' | 'Spouse' | 'Son' | 'Daughter' | 'Father' | 'Mother' | 'Brother' | 'Sister' | 'Other';
  age: number;
  dob?: string;
  gender: Gender;
  phone: string;
  alternatePhone?: string;
  occupation?: string;
  education?: string;
  rationCardNo?: string;
  specialNeeds?: 'None' | 'Elderly (80+)' | 'PwD' | 'Bedridden';
  contactPreference?: 'Phone' | 'WhatsApp' | 'In-Person';
  familyId: string;
  partNo: number;
  serialNo: number;
  villageId: string;
  villagePartId: string;
  pollingStationId: string;
  addressId: string;
  houseNo?: string;
  lat?: number;
  lng?: number;
  gpsAccuracyMeters?: number;
  status: VoterStatus;
  category: VoterCategory;
  colorState?: VoterColorState;
  issueType?: IssueType;
  issueResolutionNote?: string;
  tags: string[];
  assignedWorkerId: string;
  importBatchId?: string;
  isDeleted: boolean;
  deleteReason?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Family {
  id: string;
  familyCode: string;
  headVoterId: string;
  headName: string;
  villageId: string;
  villagePartId: string;
  pollingStationId: string;
  address: string;
  statusRollup: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Village {
  id: string;
  code: string;
  name: string;
  lat: number;
  lng: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface VillagePart {
  id: string;
  code: string;
  name: string;
  villageId: string;
  pollingStationId: string;
  partNo: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PollingStation {
  id: string;
  psNo: number;
  name: string;
  location: string;
  lat: number;
  lng: number;
  partNos: number[];
  inchargeId: string;
  workerIds: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  voterId: string;
  familyId?: string;
  pollingStationId: string;
  title: string;
  type: 'Verification' | 'Issue Resolution' | 'Meeting' | 'Follow-up';
  assigneeId: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'Scheduled' | 'Overdue' | 'Completed';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type VoterTask = Task;

export interface Note {
  id: string;
  voterId: string;
  pollingStationId: string;
  content: string;
  authorName: string;
  createdBy: string;
  createdAt: string;
}

export type VoterNote = Note;

export interface Visit {
  id: string;
  voterId: string;
  pollingStationId: string;
  outcome: string;
  lat: number;
  lng: number;
  createdBy: string;
  createdAt: string;
}

export type VoterVisit = Visit;

export interface User {
  id: string;
  uid: string;
  name: string;
  email: string;
  phone?: string;
  password?: string;
  pin?: string;
  role: UserRole;
  pollingStationIds: string[]; // 'ALL' or ['ps-1', 'ps-2', ...]
  villageIds: string[]; // 'ALL' or ['vil-1', ...]
  active: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type AppUser = User;

export interface ImportBatch {
  id: string;
  fileName: string;
  totalRows: number;
  validRows: number;
  errorRows: number;
  unassignedRows: number;
  status: 'Completed' | 'Rolled Back';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type NotificationChannel = 'SMS' | 'WhatsApp' | 'Voice Call' | 'Field Slip';

export type NotificationStatus = 'Sent' | 'Delivered' | 'Read' | 'Failed';

export type NotificationTemplateType =
  | 'Polling Slip'
  | 'Verification Reminder'
  | 'Booth Update'
  | 'Custom Message';

export interface VoterNotification {
  id: string;
  voterId: string;
  voterName: string;
  epicNo: string;
  phone: string;
  pollingStationId: string;
  channel: NotificationChannel;
  templateType: NotificationTemplateType;
  subject: string;
  message: string;
  status: NotificationStatus;
  sentByName: string;
  createdBy: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  entity: 'Voter' | 'Family' | 'PollingStation' | 'Village' | 'ImportBatch' | 'ExportRequest' | 'User' | 'Auth' | 'Task' | 'Notification';
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'STATUS_CHANGE' | 'SOFT_DELETE' | 'RESTORE' | 'MOVE_STATION' | 'FAMILY_CHANGE' | 'IMPORT' | 'ROLLBACK' | 'EXPORT_REQUEST' | 'EXPORT_APPROVE' | 'LOGIN' | 'SEND_NOTIFICATION';
  field: string;
  oldValue: string;
  newValue: string;
  userName: string;
  userRole?: UserRole;
  gps?: string;
  createdBy: string;
  createdAt: string;
}

export interface ExportRequest {
  id: string;
  scopeDescription: string;
  recordCount: number;
  reason: string;
  status: 'Pending Approval' | 'Approved' | 'Rejected';
  requesterName: string;
  approvedBy?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface UnassignedImportRecord {
  id: string;
  batchId: string;
  epicNo: string;
  name: string;
  fatherName: string;
  motherName: string;
  spouseName?: string;
  houseNo?: string;
  age: number;
  gender: Gender;
  rawAddress: string;
  rawPartNo: number;
  reason: string;
}

export interface SavedFilter {
  id: string;
  name: string;
  status?: VoterStatus | 'ALL';
  category?: VoterCategory | 'ALL';
  colorState?: VoterColorState | 'ALL';
  pollingStationIds?: string[];
  villageId?: string;
  minAge?: number;
  maxAge?: number;
  gender?: Gender | 'ALL';
  tag?: string;
  issueType?: IssueType | 'ALL';
  newlyImportedOnly?: boolean;
}

export type NavigationTab =
  | 'voter-list'
  | 'family-view'
  | 'villages-stations'
  | 'maps'
  | 'import-data'
  | 'reports'
  | 'users'
  | 'settings';
