/**
 * Firestore Security Rules Test Specification (Dirty Dozen Verification)
 * Verifies that all 12 adversarial payloads in security_spec.md return PERMISSION_DENIED.
 */

export interface DirtyDozenTestCase {
  id: number;
  name: string;
  collection: string;
  operation: 'create' | 'update' | 'delete' | 'get' | 'list';
  expectedResult: 'PERMISSION_DENIED';
  payload?: Record<string, unknown>;
}

export const DIRTY_DOZEN_TESTS: DirtyDozenTestCase[] = [
  {
    id: 1,
    name: 'Shadow Field Injection on Voter',
    collection: 'voters',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
    payload: { epicNo: 'ABC1234567', name: 'Test', isAdminOverride: true },
  },
  {
    id: 2,
    name: 'Unverified Email Admin Spoof',
    collection: 'voters',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Invalid EPIC Format',
    collection: 'voters',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
    payload: { epicNo: '1234567890' },
  },
  {
    id: 4,
    name: 'Oversized String Denial-of-Wallet',
    collection: 'voters',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
    payload: { name: 'A'.repeat(5000) },
  },
  {
    id: 5,
    name: 'Unbounded Tag Array',
    collection: 'voters',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
    payload: { tags: new Array(25).fill('tag') },
  },
  {
    id: 6,
    name: 'Audit Log Tampering',
    collection: 'auditLogs',
    operation: 'update',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Identity Spoofing on Create',
    collection: 'notes',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
    payload: { createdBy: 'spoofed_uid' },
  },
  {
    id: 8,
    name: 'Self-Assigned Admin Role',
    collection: 'users',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
    payload: { role: 'Super Admin' },
  },
  {
    id: 9,
    name: 'Immortal Field Mutation',
    collection: 'voters',
    operation: 'update',
    expectedResult: 'PERMISSION_DENIED',
    payload: { createdBy: 'mutated_uid' },
  },
  {
    id: 10,
    name: 'Terminal State Bypass on ImportBatch',
    collection: 'importBatches',
    operation: 'update',
    expectedResult: 'PERMISSION_DENIED',
    payload: { status: 'Completed' },
  },
  {
    id: 11,
    name: 'Path Variable Poisoning',
    collection: 'voters',
    operation: 'get',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'PII Leak on Users Collection',
    collection: 'users',
    operation: 'get',
    expectedResult: 'PERMISSION_DENIED',
  },
];
