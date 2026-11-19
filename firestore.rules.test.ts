/**
 * Vitalora Health — Dirty Dozen Firestore Security Rules Verification Suite
 *
 * Documents and verifies all 12 adversarial payloads against firestore.rules.
 * Intended for execution with @firebase/rules-unit-testing against the Firebase Emulator.
 */

export interface DirtyDozenTestCase {
  id: number;
  name: string;
  collectionPath: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  auth: { uid?: string; email?: string; email_verified?: boolean } | null;
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED';
  enforcedBy: string;
}

export const DIRTY_DOZEN_PAYLOADS: DirtyDozenTestCase[] = [
  {
    id: 1,
    name: 'Shadow field injection on article create',
    collectionPath: '/articles/art-shadow-1',
    operation: 'create',
    auth: { uid: 'admin1', email: 'subhankarhal007@gmail.com', email_verified: true },
    payload: { id: 'art-shadow-1', title: 'Test', isVerifiedHack: true },
    expected: 'PERMISSION_DENIED',
    enforcedBy: 'isValidArticleCreate() keys().hasOnly() gate',
  },
  {
    id: 2,
    name: 'Unverified admin email spoofing',
    collectionPath: '/articles/art-spoof-1',
    operation: 'create',
    auth: { uid: 'attacker1', email: 'subhankarhal007@gmail.com', email_verified: false },
    payload: { id: 'art-spoof-1', title: 'Spoofed' },
    expected: 'PERMISSION_DENIED',
    enforcedBy: 'isVerified() checking request.auth.token.email_verified == true',
  },
  {
    id: 3,
    name: 'Unfiltered public list query scraping drafts',
    collectionPath: '/articles',
    operation: 'list',
    auth: null,
    expected: 'PERMISSION_DENIED',
    enforcedBy: 'allow list: if resource.data.status == "published" || isPrimaryAdmin()',
  },
  {
    id: 4,
    name: 'Direct get on draft article by public visitor',
    collectionPath: '/articles/art-draft-secret',
    operation: 'get',
    auth: null,
    expected: 'PERMISSION_DENIED',
    enforcedBy: 'allow get checking resource.data.status == "published" || isAdmin()',
  },
  {
    id: 5,
    name: 'View count inflation (+1000) by unauthenticated user',
    collectionPath: '/articles/art-1',
    operation: 'update',
    auth: null,
    payload: { views: 1000 },
    expected: 'PERMISSION_DENIED',
    enforcedBy: 'incoming().views == existing().views + 1',
  },
  {
    id: 6,
    name: 'Title tampering alongside view increment',
    collectionPath: '/articles/art-1',
    operation: 'update',
    auth: null,
    payload: { views: 1, title: 'Defaced Title' },
    expected: 'PERMISSION_DENIED',
    enforcedBy: 'incoming().diff(existing()).affectedKeys().hasOnly(["views"])',
  },
  {
    id: 7,
    name: 'View increment attempted on draft article',
    collectionPath: '/articles/art-draft-1',
    operation: 'update',
    auth: null,
    payload: { views: 1 },
    expected: 'PERMISSION_DENIED',
    enforcedBy: 'existing().status == "published"',
  },
  {
    id: 8,
    name: 'Self-assigned admin role escalation',
    collectionPath: '/admins/attacker-uid',
    operation: 'create',
    auth: { uid: 'attacker-uid', email: 'attacker@example.com', email_verified: true },
    payload: { uid: 'attacker-uid', email: 'attacker@example.com', role: 'admin' },
    expected: 'PERMISSION_DENIED',
    enforcedBy: 'allow create: if isPrimaryAdmin()',
  },
  {
    id: 9,
    name: 'PII harvesting on /admins collection by non-admin',
    collectionPath: '/admins/other-admin-uid',
    operation: 'get',
    auth: { uid: 'regular-user', email: 'user@example.com', email_verified: true },
    expected: 'PERMISSION_DENIED',
    enforcedBy: 'allow get: if isValidId(userId) && (isOwner(userId) || isPrimaryAdmin())',
  },
  {
    id: 10,
    name: 'ID poisoning with invalid characters or >128 char ID',
    collectionPath: '/articles/../../evil-id',
    operation: 'create',
    auth: { uid: 'admin1', email: 'subhankarhal007@gmail.com', email_verified: true },
    payload: { id: '../../evil-id', title: 'Bad ID' },
    expected: 'PERMISSION_DENIED',
    enforcedBy: 'isValidId(articleId) regex ^[a-zA-Z0-9_\\-]+$ and size <= 128',
  },
  {
    id: 11,
    name: 'Client-forged createdAt timestamp on article creation',
    collectionPath: '/articles/art-time-1',
    operation: 'create',
    auth: { uid: 'admin1', email: 'subhankarhal007@gmail.com', email_verified: true },
    payload: { createdAt: '2020-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED',
    enforcedBy: 'incoming().createdAt == request.time',
  },
  {
    id: 12,
    name: 'Immutable authorUid mutation or oversized tags array (>15)',
    collectionPath: '/articles/art-1',
    operation: 'update',
    auth: { uid: 'admin1', email: 'subhankarhal007@gmail.com', email_verified: true },
    payload: { authorUid: 'forged-uid', tags: new Array(20).fill('spam') },
    expected: 'PERMISSION_DENIED',
    enforcedBy: 'incoming().authorUid == existing().authorUid && data.tags.size() <= 15',
  },
];
