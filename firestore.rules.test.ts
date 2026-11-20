/**
 * Payload-First Security Test Suite for Form Daftar Nikah Firestore Rules.
 * Verifies all "Dirty Dozen" adversarial payloads are rejected by firestore.rules.
 */

export interface SecurityTestCase {
  id: string;
  name: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  auth: { uid: string; email: string; email_verified: boolean } | null;
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED' | 'ALLOWED';
}

export const DIRTY_DOZEN_SECURITY_TESTS: SecurityTestCase[] = [
  {
    id: 'DD-01',
    name: 'Identity Spoofing on Create (ownerId != request.auth.uid)',
    operation: 'create',
    path: '/berkas_nikah/berkas_001',
    auth: { uid: 'userA', email: 'a@example.com', email_verified: true },
    payload: { ownerId: 'userB', kodeBerkas: 'NK-001', status: 'draft' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-02',
    name: 'Cross-Tenant PII Read on /users/{otherUid}',
    operation: 'get',
    path: '/users/userB',
    auth: { uid: 'userA', email: 'a@example.com', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-03',
    name: 'Unscoped List Scraping on /users',
    operation: 'list',
    path: '/users',
    auth: { uid: 'userA', email: 'a@example.com', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-04',
    name: 'Unverified Email Access Blocked',
    operation: 'create',
    path: '/berkas_nikah/berkas_002',
    auth: { uid: 'userA', email: 'a@example.com', email_verified: false },
    payload: { ownerId: 'userA', kodeBerkas: 'NK-002', status: 'draft' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-05',
    name: 'Shadow Field Injection (isAdmin: true)',
    operation: 'update',
    path: '/berkas_nikah/berkas_001',
    auth: { uid: 'userA', email: 'a@example.com', email_verified: true },
    payload: { isAdmin: true, status: 'lengkap' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-06',
    name: 'Ownership Transfer Attempt on Update',
    operation: 'update',
    path: '/berkas_nikah/berkas_001',
    auth: { uid: 'userA', email: 'a@example.com', email_verified: true },
    payload: { ownerId: 'userB' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-07',
    name: 'Client-Forged Timestamp Rejected',
    operation: 'create',
    path: '/berkas_nikah/berkas_003',
    auth: { uid: 'userA', email: 'a@example.com', email_verified: true },
    payload: { ownerId: 'userA', createdAt: '2020-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-08',
    name: 'String Size Overflow Poisoning',
    operation: 'update',
    path: '/berkas_nikah/berkas_001',
    auth: { uid: 'userA', email: 'a@example.com', email_verified: true },
    payload: { catatan: 'A'.repeat(2000) },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-09',
    name: 'Path Variable Poisoning (Invalid Document ID)',
    operation: 'create',
    path: '/berkas_nikah/invalid$id!script',
    auth: { uid: 'userA', email: 'a@example.com', email_verified: true },
    payload: { ownerId: 'userA' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-10',
    name: 'Nested Map Shadow Key Injection in catinPria',
    operation: 'update',
    path: '/berkas_nikah/berkas_001',
    auth: { uid: 'userA', email: 'a@example.com', email_verified: true },
    payload: { catinPria: { namaLengkap: 'Budi', ghostKey: 'injected' } },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-11',
    name: 'Value Type Poisoning on status Field',
    operation: 'update',
    path: '/berkas_nikah/berkas_001',
    auth: { uid: 'userA', email: 'a@example.com', email_verified: true },
    payload: { status: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 'DD-12',
    name: 'Terminal State Bypass on Archived Berkas',
    operation: 'update',
    path: '/berkas_nikah/berkas_archived',
    auth: { uid: 'userA', email: 'a@example.com', email_verified: true },
    payload: { status: 'draft' },
    expected: 'PERMISSION_DENIED',
  },
];
