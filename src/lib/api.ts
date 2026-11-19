import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { Article, FooterPage, SiteStats } from '../types/index.ts';
import { initialArticles, initialPages } from '../data/initialData.ts';
import {
  db,
  auth,
  googleProvider,
  OperationType,
  handleFirestoreError,
  isAuthorizedAdminUser,
  PRIMARY_ADMIN_EMAIL,
} from '../firebase.ts';

const VALID_CATEGORIES = [
  'Nutrition',
  'Mental Wellness',
  'Fitness & Movement',
  'Sleep & Recovery',
  'Preventive Care',
  'Longevity',
] as const;

const VALID_PAGE_SLUGS: FooterPage['slug'][] = [
  'about-us',
  'contact-us',
  'privacy-policy',
  'terms-and-conditions',
  'medical-disclaimer',
  'affiliate-disclosure',
];

const DEFAULT_FEATURED_IMAGE =
  'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80';
const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=200&q=80';

export function slugify(text: string): string {
  if (!text) return 'post-' + Date.now();
  const cleaned = text
    .toString()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180);
  return cleaned || 'post-' + Date.now();
}

function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
  return cleaned || `art-${Date.now()}`;
}

function normalizeCategory(cat?: string): Article['category'] {
  if (cat && (VALID_CATEGORIES as readonly string[]).includes(cat)) {
    return cat as Article['category'];
  }
  return 'Preventive Care';
}

function sanitizeTags(tags?: string[], fallbackCategory?: string): string[] {
  const list = Array.isArray(tags) ? tags : [];
  const cleaned = list
    .map((t) => String(t).trim().slice(0, 60))
    .filter((t) => t.length > 0)
    .slice(0, 15);
  if (cleaned.length === 0 && fallbackCategory) {
    return [fallbackCategory.slice(0, 60)];
  }
  return cleaned;
}

function sanitizeAuthor(author?: Partial<Article['author']>): Article['author'] {
  return {
    name: (author?.name?.trim() || 'Vitalora Health').slice(0, 120),
    role: (author?.role?.trim() || 'Editorial Team').slice(0, 120),
    avatar: (author?.avatar?.trim() || DEFAULT_AVATAR).slice(0, 2000),
  };
}

function docToArticle(data: Record<string, any>): Article {
  return {
    id: String(data.id || ''),
    slug: String(data.slug || ''),
    title: String(data.title || 'Untitled Article'),
    excerpt: String(data.excerpt || ''),
    category: normalizeCategory(data.category),
    featuredImage: String(data.featuredImage || DEFAULT_FEATURED_IMAGE),
    imageCaption: String(data.imageCaption || ''),
    author: sanitizeAuthor(data.author),
    publishedAt: String(data.publishedAt || new Date().toISOString().split('T')[0]),
    updatedAt: data.updatedAt ? String(data.updatedAt) : undefined,
    readTime: String(data.readTime || '5 min read'),
    status: data.status === 'draft' ? 'draft' : 'published',
    content: String(data.content || ''),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    views: typeof data.views === 'number' && Number.isFinite(data.views) ? Math.max(0, Math.floor(data.views)) : 0,
  };
}

function getSortTimestamp(docData: Record<string, any>): number {
  const created = docData.createdAt;
  if (created instanceof Timestamp) {
    return created.toMillis();
  }
  if (created && typeof created.seconds === 'number') {
    return created.seconds * 1000;
  }
  const parsed = Date.parse(docData.publishedAt || '');
  return Number.isNaN(parsed) ? 0 : parsed;
}

// Legacy token helpers kept as no-ops for backwards compatibility with components
export function getAdminToken(): string | null {
  return auth.currentUser ? auth.currentUser.uid : null;
}

export function setAdminToken(_token: string) {
  // Handled automatically by Firebase Auth persistence
}

export function removeAdminToken() {
  signOut(auth).catch(() => {});
}

// --- AUTHENTICATION (Firebase Google Auth) ---
export async function loginAdminWithGoogle(): Promise<{
  uid: string;
  email: string;
  displayName: string;
}> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  const authorized = await isAuthorizedAdminUser(user);

  if (!authorized) {
    await signOut(auth);
    throw new Error(
      `Access Denied: "${user.email || 'Unknown account'}" is not authorized. Please sign in with the site administrator Google account (${PRIMARY_ADMIN_EMAIL}).`
    );
  }

  return {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || 'Vitalora Admin',
  };
}

export async function logoutAdmin(): Promise<void> {
  await signOut(auth);
}

export async function verifyAdminSession(): Promise<boolean> {
  return isAuthorizedAdminUser(auth.currentUser);
}

export function subscribeToAdminAuth(
  callback: (isAdmin: boolean, user: User | null) => void
): () => void {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback(false, null);
      return;
    }
    const authorized = await isAuthorizedAdminUser(user);
    callback(authorized, user);
  });
}

// --- ARTICLES (Firestore) ---
export async function fetchArticles(params?: {
  category?: string;
  search?: string;
  status?: string;
  all?: boolean;
}): Promise<Article[]> {
  const colPath = 'articles';
  let rows: Array<{ article: Article; sortTs: number }> = [];

  try {
    const canFetchAll = params?.all && (await isAuthorizedAdminUser(auth.currentUser));
    const q = canFetchAll
      ? collection(db, colPath)
      : query(collection(db, colPath), where('status', '==', 'published'));

    const snap = await getDocs(q);
    rows = snap.docs.map((d) => {
      const raw = d.data();
      return {
        article: docToArticle({ ...raw, id: raw.id || d.id }),
        sortTs: getSortTimestamp(raw),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, colPath);
  }

  rows.sort((a, b) => b.sortTs - a.sortTs);
  let combined = rows.map((r) => r.article);

  if (params?.status) {
    combined = combined.filter((a) => a.status === params.status);
  }
  if (params?.category && params.category !== 'All') {
    combined = combined.filter(
      (a) => a.category.toLowerCase() === params.category!.toLowerCase()
    );
  }
  if (params?.search) {
    const qStr = params.search.toLowerCase();
    combined = combined.filter(
      (a) =>
        a.title.toLowerCase().includes(qStr) ||
        a.excerpt.toLowerCase().includes(qStr) ||
        a.category.toLowerCase().includes(qStr) ||
        (a.tags && a.tags.some((t) => t.toLowerCase().includes(qStr)))
    );
  }

  return combined;
}

export async function fetchArticleBySlug(slugOrId: string): Promise<Article> {
  const decoded = decodeURIComponent(slugOrId);
  const colPath = 'articles';

  // 1. Try direct ID lookup if it matches valid ID regex
  if (/^[a-zA-Z0-9_-]{1,128}$/.test(decoded)) {
    try {
      const snap = await getDoc(doc(db, colPath, decoded));
      if (snap.exists()) {
        return docToArticle({ ...snap.data(), id: snap.id });
      }
    } catch {
      // Fall through to slug query
    }
  }

  // 2. Query by slug
  try {
    const isAdmin = await isAuthorizedAdminUser(auth.currentUser);
    const q = isAdmin
      ? query(collection(db, colPath), where('slug', '==', decoded))
      : query(
          collection(db, colPath),
          where('status', '==', 'published'),
          where('slug', '==', decoded)
        );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const first = snap.docs[0];
      return docToArticle({ ...first.data(), id: first.id });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${colPath}/${decoded}`);
  }

  throw new Error('Article not found');
}

export async function recordArticleView(articleId: string): Promise<number> {
  if (!articleId || !/^[a-zA-Z0-9_-]{1,128}$/.test(articleId)) return 0;
  const docPath = `articles/${articleId}`;
  try {
    const ref = doc(db, 'articles', articleId);
    await updateDoc(ref, {
      views: increment(1),
    });
    const updated = await getDoc(ref);
    return updated.exists() ? Number(updated.data()?.views || 1) : 1;
  } catch (error) {
    // Do not crash reader view if an offline/ad-blocked visitor fails to increment
    console.warn('Could not record view in Firestore:', docPath, error);
    return 0;
  }
}

export async function createArticle(data: Partial<Article>): Promise<Article> {
  const user = auth.currentUser;
  if (!user || !(await isAuthorizedAdminUser(user))) {
    throw new Error('Please sign in with your authorized Admin Google account first.');
  }

  const title = (data.title || '').trim().slice(0, 300);
  const content = (data.content || '').trim().slice(0, 350000);
  if (!title) throw new Error('Article title is required');
  if (!content) throw new Error('Article content cannot be empty');

  const id = sanitizeId(`art-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  const baseSlug = slugify(data.slug?.trim() || title);
  const finalSlug = `${baseSlug.slice(0, 185)}-${id.slice(-5)}`;
  const category = normalizeCategory(data.category);
  const plainText = content
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const excerpt = (
    data.excerpt?.trim() ||
    (plainText.length > 160 ? `${plainText.slice(0, 160)}...` : plainText) ||
    title
  ).slice(0, 1000);

  const words = plainText.split(/\s+/).filter(Boolean).length;
  const readTime = (data.readTime?.trim() || `${Math.max(1, Math.ceil(words / 150))} min read`).slice(0, 40);
  const featuredImage = (data.featuredImage?.trim() || DEFAULT_FEATURED_IMAGE).slice(0, 400000);
  const imageCaption = (data.imageCaption?.trim() || '').slice(0, 500);
  const publishedAt = new Date().toISOString().split('T')[0];
  const status: 'published' | 'draft' = data.status === 'draft' ? 'draft' : 'published';
  const tags = sanitizeTags(data.tags, category);
  const author = sanitizeAuthor(data.author);

  const payload = {
    id,
    slug: finalSlug.slice(0, 200),
    title,
    excerpt,
    category,
    featuredImage,
    imageCaption,
    author,
    publishedAt,
    readTime,
    status,
    content,
    tags,
    views: 0,
    authorUid: user.uid,
    createdAt: serverTimestamp(),
    updatedAtTimestamp: serverTimestamp(),
  };

  const docPath = `articles/${id}`;
  try {
    await setDoc(doc(db, 'articles', id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, docPath);
  }

  return docToArticle(payload);
}

export async function updateArticle(id: string, data: Partial<Article>): Promise<Article> {
  const user = auth.currentUser;
  if (!user || !(await isAuthorizedAdminUser(user))) {
    throw new Error('Please sign in with your authorized Admin Google account first.');
  }

  const safeId = sanitizeId(id);
  const docPath = `articles/${safeId}`;
  const ref = doc(db, 'articles', safeId);

  let existingData: Record<string, any>;
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      throw new Error('Article not found in database');
    }
    existingData = snap.data();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, docPath);
  }

  const updates: Record<string, any> = {
    updatedAt: new Date().toISOString().split('T')[0],
    updatedAtTimestamp: serverTimestamp(),
  };

  if (data.title !== undefined) {
    const trimmed = data.title.trim().slice(0, 300);
    if (!trimmed) throw new Error('Article title is required');
    updates.title = trimmed;
  }
  if (data.slug !== undefined && data.slug.trim()) {
    updates.slug = slugify(data.slug.trim()).slice(0, 200);
  }
  if (data.content !== undefined) {
    const trimmedContent = data.content.trim().slice(0, 350000);
    if (!trimmedContent) throw new Error('Article content cannot be empty');
    updates.content = trimmedContent;
  }
  if (data.excerpt !== undefined) {
    updates.excerpt = data.excerpt.trim().slice(0, 1000);
  }
  if (data.category !== undefined) {
    updates.category = normalizeCategory(data.category);
  }
  if (data.featuredImage !== undefined) {
    updates.featuredImage = (data.featuredImage.trim() || DEFAULT_FEATURED_IMAGE).slice(0, 400000);
  }
  if (data.imageCaption !== undefined) {
    updates.imageCaption = data.imageCaption.trim().slice(0, 500);
  }
  if (data.readTime !== undefined && data.readTime.trim()) {
    updates.readTime = data.readTime.trim().slice(0, 40);
  }
  if (data.status !== undefined) {
    updates.status = data.status === 'draft' ? 'draft' : 'published';
  }
  if (data.tags !== undefined) {
    updates.tags = sanitizeTags(data.tags, updates.category || existingData.category);
  }
  if (data.author !== undefined) {
    updates.author = sanitizeAuthor(data.author);
  }

  try {
    await updateDoc(ref, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }

  return docToArticle({ ...existingData, ...updates, id: safeId });
}

export async function deleteArticle(id: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !(await isAuthorizedAdminUser(user))) {
    throw new Error('Please sign in with your authorized Admin Google account first.');
  }

  const safeId = sanitizeId(id);
  const docPath = `articles/${safeId}`;
  try {
    await deleteDoc(doc(db, 'articles', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function clearDemoArticles(): Promise<{ success: boolean; remainingCount: number }> {
  const user = auth.currentUser;
  if (!user || !(await isAuthorizedAdminUser(user))) {
    throw new Error('Unauthorized admin action');
  }

  const sampleIds = ['art-1', 'art-2', 'art-3', 'art-4', 'art-5', 'art-6'];
  for (const id of sampleIds) {
    try {
      await deleteDoc(doc(db, 'articles', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `articles/${id}`);
    }
  }

  const remaining = await fetchArticles({ all: true });
  return { success: true, remainingCount: remaining.length };
}

export async function restoreDemoArticles(): Promise<{ success: boolean; totalCount: number }> {
  const user = auth.currentUser;
  if (!user || !(await isAuthorizedAdminUser(user))) {
    throw new Error('Unauthorized admin action');
  }

  for (const art of initialArticles) {
    const safeId = sanitizeId(art.id);
    const ref = doc(db, 'articles', safeId);
    const payload = {
      id: safeId,
      slug: art.slug.slice(0, 200),
      title: art.title.slice(0, 300),
      excerpt: art.excerpt.slice(0, 1000),
      category: normalizeCategory(art.category),
      featuredImage: art.featuredImage.slice(0, 400000),
      imageCaption: (art.imageCaption || '').slice(0, 500),
      author: sanitizeAuthor(art.author),
      publishedAt: art.publishedAt.slice(0, 40),
      readTime: art.readTime.slice(0, 40),
      status: art.status === 'draft' ? 'draft' : 'published',
      content: art.content.slice(0, 350000),
      tags: sanitizeTags(art.tags, art.category),
      views: 0,
      authorUid: user.uid,
      createdAt: serverTimestamp(),
      updatedAtTimestamp: serverTimestamp(),
    };

    try {
      const existing = await getDoc(ref);
      if (!existing.exists()) {
        await setDoc(ref, payload);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `articles/${safeId}`);
    }
  }

  const total = await fetchArticles({ all: true });
  return { success: true, totalCount: total.length };
}

// --- FOOTER PAGES (Firestore with static defaults) ---
export async function fetchPages(): Promise<FooterPage[]> {
  const pageMap = new Map<string, FooterPage>();
  initialPages.forEach((p) => pageMap.set(p.slug, p));

  try {
    const q = query(collection(db, 'pages'), where('slug', 'in', VALID_PAGE_SLUGS));
    const snap = await getDocs(q);
    snap.docs.forEach((d) => {
      const data = d.data();
      if (data.slug && (VALID_PAGE_SLUGS as string[]).includes(data.slug)) {
        pageMap.set(data.slug, {
          slug: data.slug as FooterPage['slug'],
          title: String(data.title || ''),
          lastUpdated: String(data.lastUpdated || ''),
          content: String(data.content || ''),
        });
      }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'pages');
  }

  return VALID_PAGE_SLUGS.map((slug) => pageMap.get(slug)!).filter(Boolean);
}

export async function fetchPage(slug: string): Promise<FooterPage> {
  if (!(VALID_PAGE_SLUGS as string[]).includes(slug)) {
    throw new Error('Page not found');
  }

  try {
    const snap = await getDoc(doc(db, 'pages', slug));
    if (snap.exists()) {
      const data = snap.data();
      return {
        slug: slug as FooterPage['slug'],
        title: String(data.title || ''),
        lastUpdated: String(data.lastUpdated || ''),
        content: String(data.content || ''),
      };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `pages/${slug}`);
  }

  const fallback = initialPages.find((p) => p.slug === slug);
  if (fallback) return fallback;
  throw new Error('Page not found');
}

export async function updatePage(
  slug: string,
  data: { title: string; content: string }
): Promise<FooterPage> {
  const user = auth.currentUser;
  if (!user || !(await isAuthorizedAdminUser(user))) {
    throw new Error('Please sign in with your authorized Admin Google account first.');
  }
  if (!(VALID_PAGE_SLUGS as string[]).includes(slug)) {
    throw new Error('Invalid page slug');
  }

  const title = data.title.trim().slice(0, 200);
  const content = data.content.trim().slice(0, 150000);
  if (!title || !content) {
    throw new Error('Page title and content are required');
  }

  const lastUpdated = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const ref = doc(db, 'pages', slug);
  const docPath = `pages/${slug}`;

  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, {
        title,
        content,
        lastUpdated,
        updatedAtTimestamp: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        slug,
        title,
        content,
        lastUpdated,
        updatedAtTimestamp: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }

  return {
    slug: slug as FooterPage['slug'],
    title,
    lastUpdated,
    content,
  };
}

// --- SITE STATS (100% Real Firestore Counts) ---
export async function fetchSiteStats(): Promise<SiteStats> {
  const allArticles = await fetchArticles({ all: true });
  const publishedCount = allArticles.filter((a) => a.status === 'published').length;
  const draftCount = allArticles.filter((a) => a.status === 'draft').length;
  const totalViews = allArticles.reduce((sum, a) => sum + (a.views || 0), 0);
  const categories: { [key: string]: number } = {};
  allArticles.forEach((a) => {
    categories[a.category] = (categories[a.category] || 0) + 1;
  });

  return {
    totalArticles: allArticles.length,
    publishedCount,
    draftCount,
    totalViews,
    categories,
  };
}
