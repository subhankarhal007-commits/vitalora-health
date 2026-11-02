import { Article, FooterPage, SiteStats } from '../types/index.ts';

const TOKEN_KEY = 'vitalora_admin_token';
const LOCAL_ARTICLES_KEY = 'vitalora_persistent_articles';
const DELETED_IDS_KEY = 'vitalora_deleted_ids';

export function getAdminToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeAdminToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getAdminToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Track permanently deleted article IDs so they NEVER reappear automatically
function getDeletedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_IDS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function markIdAsDeleted(id: string) {
  try {
    const set = getDeletedIds();
    set.add(id);
    localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(Array.from(set)));
  } catch (err) {
    console.warn('Failed to save deleted ID:', err);
  }
}

function unmarkIdAsDeleted(id: string) {
  try {
    const set = getDeletedIds();
    set.delete(id);
    localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(Array.from(set)));
  } catch (err) {
    console.warn('Failed to unmark deleted ID:', err);
  }
}

function getLocalArticles(): Article[] {
  try {
    const raw = localStorage.getItem(LOCAL_ARTICLES_KEY);
    const list: Article[] = raw ? JSON.parse(raw) : [];
    const deleted = getDeletedIds();
    return list.filter(a => !deleted.has(a.id));
  } catch {
    return [];
  }
}

function saveLocalArticle(article: Article) {
  try {
    const deleted = getDeletedIds();
    if (deleted.has(article.id)) return;
    const existing = getLocalArticles().filter(a => a.id !== article.id);
    localStorage.setItem(LOCAL_ARTICLES_KEY, JSON.stringify([article, ...existing]));
  } catch (err) {
    console.warn('Failed to save to localStorage:', err);
  }
}

function removeLocalArticle(id: string) {
  try {
    markIdAsDeleted(id);
    const existing = getLocalArticles().filter(a => a.id !== id);
    localStorage.setItem(LOCAL_ARTICLES_KEY, JSON.stringify(existing));
  } catch (err) {
    console.warn('Failed to remove from localStorage:', err);
  }
}

export async function fetchArticles(params?: { category?: string; search?: string; status?: string; all?: boolean }): Promise<Article[]> {
  const query = new URLSearchParams();
  if (params?.category && params.category !== 'All') query.set('category', params.category);
  if (params?.search) query.set('search', params.search);
  if (params?.status) query.set('status', params.status);
  if (params?.all) query.set('all', 'true');

  const deletedIds = getDeletedIds();
  let serverArticles: Article[] = [];

  try {
    const res = await fetch(`/api/articles?${query.toString()}`, {
      headers: authHeaders(),
    });
    if (res.ok) {
      serverArticles = await res.json();
    }
  } catch (err) {
    console.warn('Server fetch error, falling back to local storage:', err);
  }

  // Filter out any IDs that the user has explicitly removed
  serverArticles = serverArticles.filter(a => !deletedIds.has(a.id));

  // Merge with client-side local custom articles (which are also filtered for deleted IDs)
  const localArticles = getLocalArticles();
  const mergedMap = new Map<string, Article>();

  localArticles.forEach(a => {
    if (!deletedIds.has(a.id)) {
      mergedMap.set(a.id, a);
    }
  });

  serverArticles.forEach(a => {
    if (!deletedIds.has(a.id)) {
      mergedMap.set(a.id, a);
      saveLocalArticle(a);
    }
  });

  let combined = Array.from(mergedMap.values());

  if (params?.status) {
    combined = combined.filter(a => a.status === params.status);
  }
  if (params?.category && params.category !== 'All') {
    combined = combined.filter(a => a.category.toLowerCase() === params.category!.toLowerCase());
  }
  if (params?.search) {
    const q = params.search.toLowerCase();
    combined = combined.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.excerpt.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      (a.tags && a.tags.some(t => t.toLowerCase().includes(q)))
    );
  }

  // Sort newest first
  combined.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return combined;
}

export async function fetchArticleBySlug(slugOrId: string): Promise<Article> {
  const deletedIds = getDeletedIds();
  if (deletedIds.has(slugOrId)) {
    throw new Error('Article has been removed');
  }

  try {
    const res = await fetch(`/api/articles/${encodeURIComponent(slugOrId)}`, {
      headers: authHeaders(),
    });
    if (res.ok) {
      const art = await res.json();
      if (!deletedIds.has(art.id)) {
        saveLocalArticle(art);
        return art;
      }
    }
  } catch {}

  const local = getLocalArticles().find(a => (a.slug === slugOrId || a.id === slugOrId) && !deletedIds.has(a.id));
  if (local) return local;

  throw new Error('Article not found');
}

export async function createArticle(data: Partial<Article>): Promise<Article> {
  let createdArticle: Article;

  try {
    const res = await fetch('/api/articles', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    if (res.ok) {
      createdArticle = await res.json();
    } else {
      throw new Error('Server create failed');
    }
  } catch (err) {
    createdArticle = {
      id: 'art-' + Date.now(),
      slug: (data.title || 'article').toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/[\s_-]+/g, '-'),
      title: data.title || 'Untitled Article',
      excerpt: data.excerpt || data.title || '',
      category: data.category || 'Nutrition',
      featuredImage: data.featuredImage || 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
      imageCaption: data.imageCaption || '',
      author: {
        name: data.author?.name || 'Vitalora Health',
        role: 'Editorial Team',
        avatar: data.author?.avatar || 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=200&q=80'
      },
      publishedAt: new Date().toISOString().split('T')[0],
      readTime: data.readTime || '5 min read',
      status: data.status || 'published',
      content: data.content || '',
      tags: data.tags || ['Health'],
      views: 0
    };
  }

  // Ensure this ID is not in deletedIds
  unmarkIdAsDeleted(createdArticle.id);
  saveLocalArticle(createdArticle);
  return createdArticle;
}

export async function updateArticle(id: string, data: Partial<Article>): Promise<Article> {
  let updatedArticle: Article;
  try {
    const res = await fetch(`/api/articles/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    if (res.ok) {
      updatedArticle = await res.json();
    } else {
      throw new Error('Server update failed');
    }
  } catch {
    const existing = getLocalArticles().find(a => a.id === id);
    updatedArticle = {
      ...(existing || ({} as any)),
      ...data,
      id,
    } as Article;
  }

  unmarkIdAsDeleted(id);
  saveLocalArticle(updatedArticle);
  return updatedArticle;
}

// Manual delete permanently
export async function deleteArticle(id: string): Promise<void> {
  removeLocalArticle(id);
  try {
    await fetch(`/api/articles/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
  } catch (err) {
    console.warn('Server delete error:', err);
  }
}

// Clear all demo posts permanently
export async function clearDemoArticles(): Promise<{ success: boolean; remainingCount: number }> {
  const sampleIds = ['art-1', 'art-2', 'art-3', 'art-4', 'art-5', 'art-6'];
  sampleIds.forEach(id => removeLocalArticle(id));

  try {
    const res = await fetch('/api/articles/clear-demo', {
      method: 'POST',
      headers: authHeaders(),
    });
    if (res.ok) {
      return res.json();
    }
  } catch {}

  return { success: true, remainingCount: getLocalArticles().length };
}

// Restore demo posts if user asks
export async function restoreDemoArticles(): Promise<{ success: boolean; totalCount: number }> {
  const sampleIds = ['art-1', 'art-2', 'art-3', 'art-4', 'art-5', 'art-6'];
  sampleIds.forEach(id => unmarkIdAsDeleted(id));

  try {
    const res = await fetch('/api/articles/restore-demo', {
      method: 'POST',
      headers: authHeaders(),
    });
    if (res.ok) {
      return res.json();
    }
  } catch {}
  return { success: true, totalCount: getLocalArticles().length };
}

export async function fetchPages(): Promise<FooterPage[]> {
  const res = await fetch('/api/pages');
  if (!res.ok) throw new Error('Failed to fetch pages');
  return res.json();
}

export async function fetchPage(slug: string): Promise<FooterPage> {
  const res = await fetch(`/api/pages/${encodeURIComponent(slug)}`);
  if (!res.ok) throw new Error('Page not found');
  return res.json();
}

export async function updatePage(slug: string, data: { title: string; content: string }): Promise<FooterPage> {
  const res = await fetch(`/api/pages/${encodeURIComponent(slug)}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update page');
  return res.json();
}

export async function loginAdmin(email: string, password: string): Promise<{ token: string; admin: any }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Invalid credentials');
  }
  return res.json();
}

export async function verifyAdminSession(): Promise<boolean> {
  const token = getAdminToken();
  if (!token) return false;
  try {
    const res = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: authHeaders(),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return !!data.valid;
  } catch {
    return false;
  }
}

export async function fetchSiteStats(): Promise<SiteStats> {
  const res = await fetch('/api/stats', {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}
