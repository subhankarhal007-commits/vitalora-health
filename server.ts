import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { initialArticles, initialPages } from './src/data/initialData.ts';
import { Article, FooterPage, SiteStats } from './src/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const ARTICLES_FILE = path.join(DATA_DIR, 'articles.json');
const PAGES_FILE = path.join(DATA_DIR, 'pages.json');
const ADMIN_FILE = path.join(DATA_DIR, 'admin.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize files if not existing
if (!fs.existsSync(ARTICLES_FILE)) {
  fs.writeFileSync(ARTICLES_FILE, JSON.stringify(initialArticles, null, 2), 'utf-8');
}

if (!fs.existsSync(PAGES_FILE)) {
  fs.writeFileSync(PAGES_FILE, JSON.stringify(initialPages, null, 2), 'utf-8');
}

const DEFAULT_ADMIN = {
  email: 'admin@vitalorahealth.com',
  passwordHash: crypto.createHash('sha256').update('vitalora2026!').digest('hex'),
  name: 'Vitalora Editorial Director',
  tokens: [] as string[]
};

if (!fs.existsSync(ADMIN_FILE)) {
  fs.writeFileSync(ADMIN_FILE, JSON.stringify(DEFAULT_ADMIN, null, 2), 'utf-8');
}

// Helpers to read/write persistent data
function getArticles(): Article[] {
  try {
    const raw = fs.readFileSync(ARTICLES_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read articles:', err);
    return initialArticles;
  }
}

function saveArticles(articles: Article[]) {
  fs.writeFileSync(ARTICLES_FILE, JSON.stringify(articles, null, 2), 'utf-8');
}

function getPages(): FooterPage[] {
  try {
    const raw = fs.readFileSync(PAGES_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read pages:', err);
    return initialPages;
  }
}

function savePages(pages: FooterPage[]) {
  fs.writeFileSync(PAGES_FILE, JSON.stringify(pages, null, 2), 'utf-8');
}

function getAdmin() {
  try {
    const raw = fs.readFileSync(ADMIN_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return DEFAULT_ADMIN;
  }
}

function saveAdmin(adminData: any) {
  fs.writeFileSync(ADMIN_FILE, JSON.stringify(adminData, null, 2), 'utf-8');
}

function verifyAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Admin authentication token required' });
    return;
  }
  const token = authHeader.split(' ')[1];
  const admin = getAdmin();
  if (!admin.tokens || !admin.tokens.includes(token)) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    return;
  }
  next();
}

function slugify(text: string): string {
  if (!text) return 'article-' + Date.now();
  const cleaned = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || 'article-' + Date.now();
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // CORS headers
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // --- AUTH ENDPOINTS ---
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const admin = getAdmin();
    const inputHash = crypto.createHash('sha256').update(password).digest('hex');

    if (email.toLowerCase().trim() === admin.email.toLowerCase() && inputHash === admin.passwordHash) {
      const token = 'vitalora_token_' + crypto.randomBytes(32).toString('hex');
      admin.tokens = admin.tokens || [];
      // Keep only last 10 tokens
      admin.tokens = [...admin.tokens.slice(-9), token];
      saveAdmin(admin);

      res.json({
        token,
        admin: {
          email: admin.email,
          name: admin.name
        }
      });
      return;
    }

    res.status(401).json({ error: 'Invalid email or password' });
  });

  app.post('/api/auth/verify', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ valid: false });
      return;
    }
    const token = authHeader.split(' ')[1];
    const admin = getAdmin();
    if (admin.tokens && admin.tokens.includes(token)) {
      res.json({ valid: true, admin: { email: admin.email, name: admin.name } });
      return;
    }
    res.status(401).json({ valid: false });
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const admin = getAdmin();
      if (admin.tokens) {
        admin.tokens = admin.tokens.filter((t: string) => t !== token);
        saveAdmin(admin);
      }
    }
    res.json({ success: true });
  });

  // --- STATS ENDPOINT ---
  app.get('/api/stats', (_req: Request, res: Response) => {
    const articles = getArticles();
    const published = articles.filter(a => a.status === 'published');
    const drafts = articles.filter(a => a.status === 'draft');
    const totalViews = articles.reduce((acc, curr) => acc + (curr.views || 0), 0);
    const categories: Record<string, number> = {};

    articles.forEach(a => {
      categories[a.category] = (categories[a.category] || 0) + 1;
    });

    const stats: SiteStats = {
      totalArticles: articles.length,
      publishedCount: published.length,
      draftCount: drafts.length,
      totalViews,
      categories
    };
    res.json(stats);
  });

  // --- ARTICLES ENDPOINTS ---
  // Public & Admin articles query
  app.get('/api/articles', (req: Request, res: Response) => {
    const { category, search, status, all } = req.query;
    let articles = getArticles();

    // Check if user is admin
    const authHeader = req.headers.authorization;
    let isAdmin = false;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const admin = getAdmin();
      if (admin.tokens && admin.tokens.includes(token)) {
        isAdmin = true;
      }
    }

    // Non-admins only see published articles
    if (!isAdmin && all !== 'true') {
      articles = articles.filter(a => a.status === 'published');
    } else if (status) {
      articles = articles.filter(a => a.status === status);
    }

    if (category && category !== 'All') {
      articles = articles.filter(a => a.category.toLowerCase() === String(category).toLowerCase());
    }

    if (search) {
      const q = String(search).toLowerCase();
      articles = articles.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        (a.tags && a.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    // Sort by publication date descending
    articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    res.json(articles);
  });

  // Get article by slug or ID
  app.get('/api/articles/:slugOrId', (req: Request, res: Response) => {
    const { slugOrId } = req.params;
    const articles = getArticles();
    const articleIndex = articles.findIndex(a => a.slug === slugOrId || a.id === slugOrId);

    if (articleIndex === -1) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }

    const article = articles[articleIndex];

    // Increment views for public reads (non-admin)
    const authHeader = req.headers.authorization;
    let isAdmin = false;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const admin = getAdmin();
      isAdmin = !!(admin.tokens && admin.tokens.includes(token));
    }

    if (!isAdmin) {
      articles[articleIndex].views = (articles[articleIndex].views || 0) + 1;
      saveArticles(articles);
    }

    res.json(article);
  });

  // Dedicated endpoint to record a public reader view
  app.post('/api/articles/:slugOrId/view', (req: Request, res: Response) => {
    const { slugOrId } = req.params;
    const articles = getArticles();
    const articleIndex = articles.findIndex(a => a.slug === slugOrId || a.id === slugOrId);

    if (articleIndex === -1) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }

    const authHeader = req.headers.authorization;
    let isAdmin = false;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const admin = getAdmin();
      isAdmin = !!(admin.tokens && admin.tokens.includes(token));
    }

    if (!isAdmin) {
      articles[articleIndex].views = (articles[articleIndex].views || 0) + 1;
      saveArticles(articles);
    }

    res.json({ success: true, views: articles[articleIndex].views });
  });

  // Create new article - always save permanently to database
  app.post('/api/articles', (req: Request, res: Response) => {
    try {
      const {
        title,
        slug,
        excerpt,
        category,
        featuredImage,
        imageCaption,
        content,
        status = 'published',
        tags = [],
        readTime,
        author
      } = req.body;

      if (!title || !String(title).trim()) {
        res.status(400).json({ error: 'Article title is required' });
        return;
      }

      if (!content || !String(content).trim()) {
        res.status(400).json({ error: 'Article content cannot be empty' });
        return;
      }

      const articles = getArticles();
      const baseSlug = slugify(slug || title);
      let finalSlug = baseSlug;
      let counter = 1;
      while (articles.some(a => a.slug === finalSlug)) {
        finalSlug = `${baseSlug}-${counter++}`;
      }

      // Calculate approximate read time if not provided
      const words = String(content).replace(/<[^>]*>?/gm, '').split(/\s+/).filter(Boolean).length;
      const computedReadTime = (readTime && String(readTime).trim()) || `${Math.max(1, Math.ceil(words / 150))} min read`;

      const plainText = String(content).replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
      const computedExcerpt = excerpt?.trim() || (plainText.length > 150 ? plainText.slice(0, 150) + '...' : plainText) || String(title).trim();

      const newArticle: Article = {
        id: 'art-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        slug: finalSlug,
        title: String(title).trim(),
        excerpt: computedExcerpt,
        category: category || 'Preventive Care',
        featuredImage: featuredImage || 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
        imageCaption: imageCaption || '',
        author: author || {
          name: 'Vitalora Health',
          role: 'Editorial Team',
          avatar: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=200&q=80'
        },
        publishedAt: new Date().toISOString().split('T')[0],
        readTime: computedReadTime,
        status: status === 'draft' ? 'draft' : 'published',
        content: String(content).trim(),
        tags: Array.isArray(tags) ? tags : [category || 'Health'],
        views: 0
      };

      articles.unshift(newArticle);
      saveArticles(articles);

      res.status(201).json(newArticle);
    } catch (err: any) {
      console.error('Server error creating article:', err);
      res.status(500).json({ error: err.message || 'Server error creating article' });
    }
  });

  // Update existing article
  app.put('/api/articles/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const articles = getArticles();
      const index = articles.findIndex(a => a.id === id);

      if (index === -1) {
        res.status(404).json({ error: 'Article not found' });
        return;
      }

      const existing = articles[index];
      const {
        title,
        slug,
        excerpt,
        category,
        featuredImage,
        imageCaption,
        content,
        status,
        tags,
        readTime,
        author
      } = req.body;

      let targetSlug = existing.slug;
      if (slug && slug !== existing.slug) {
        targetSlug = slugify(slug);
      } else if (title && title !== existing.title && !slug) {
        targetSlug = slugify(title);
      }

      // Ensure slug uniqueness among other articles
      let finalSlug = targetSlug;
      let counter = 1;
      while (articles.some(a => a.slug === finalSlug && a.id !== id)) {
        finalSlug = `${targetSlug}-${counter++}`;
      }

      const updatedContent = content !== undefined ? String(content) : existing.content;
      const words = updatedContent.replace(/<[^>]*>?/gm, '').split(/\s+/).filter(Boolean).length;
      const computedReadTime = (readTime && String(readTime).trim()) || existing.readTime || `${Math.max(1, Math.ceil(words / 150))} min read`;

      const plainText = updatedContent.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
      const computedExcerpt = excerpt !== undefined ? (excerpt?.trim() || plainText.slice(0, 150)) : existing.excerpt;

      const updated: Article = {
        ...existing,
        title: title !== undefined ? String(title).trim() : existing.title,
        slug: finalSlug,
        excerpt: computedExcerpt,
        category: category !== undefined ? category : existing.category,
        featuredImage: featuredImage !== undefined ? featuredImage : existing.featuredImage,
        imageCaption: imageCaption !== undefined ? imageCaption : existing.imageCaption,
        content: updatedContent,
        status: status !== undefined ? status : existing.status,
        tags: tags !== undefined ? tags : existing.tags,
        readTime: computedReadTime,
        author: author !== undefined ? author : existing.author,
        updatedAt: new Date().toISOString().split('T')[0]
      };

      articles[index] = updated;
      saveArticles(articles);

      res.json(updated);
    } catch (err: any) {
      console.error('Server error updating article:', err);
      res.status(500).json({ error: err.message || 'Server error updating article' });
    }
  });

  // Delete article (Manual removal)
  app.delete('/api/articles/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    let articles = getArticles();
    const exists = articles.some(a => a.id === id);

    if (!exists) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }

    articles = articles.filter(a => a.id !== id);
    saveArticles(articles);

    res.json({ success: true, message: 'Article deleted successfully' });
  });

  // Clear demo / sample articles
  app.post('/api/articles/clear-demo', (_req: Request, res: Response) => {
    let articles = getArticles();
    const sampleIds = ['art-1', 'art-2', 'art-3', 'art-4', 'art-5', 'art-6'];
    articles = articles.filter(a => !sampleIds.includes(a.id));
    saveArticles(articles);
    res.json({ success: true, remainingCount: articles.length });
  });

  // Restore sample demo articles
  app.post('/api/articles/restore-demo', (_req: Request, res: Response) => {
    let articles = getArticles();
    for (const init of initialArticles) {
      if (!articles.some(a => a.id === init.id)) {
        articles.push(init);
      }
    }
    saveArticles(articles);
    res.json({ success: true, totalCount: articles.length });
  });

  // --- FOOTER PAGES ENDPOINTS ---
  app.get('/api/pages', (_req: Request, res: Response) => {
    const pages = getPages();
    res.json(pages);
  });

  app.get('/api/pages/:slug', (req: Request, res: Response) => {
    const { slug } = req.params;
    const pages = getPages();
    const page = pages.find(p => p.slug === slug);
    if (!page) {
      res.status(404).json({ error: 'Page not found' });
      return;
    }
    res.json(page);
  });

  app.put('/api/pages/:slug', verifyAuth, (req: Request, res: Response) => {
    const { slug } = req.params;
    const { title, content } = req.body;
    const pages = getPages();
    const index = pages.findIndex(p => p.slug === slug);

    if (index === -1) {
      res.status(404).json({ error: 'Page not found' });
      return;
    }

    pages[index] = {
      ...pages[index],
      title: title !== undefined ? title : pages[index].title,
      content: content !== undefined ? content : pages[index].content,
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    savePages(pages);
    res.json(pages[index]);
  });

  // Image upload/URL endpoint
  app.post('/api/upload', verifyAuth, (req: Request, res: Response) => {
    const { dataUrl, filename } = req.body;
    if (!dataUrl) {
      res.status(400).json({ error: 'Data URL is required' });
      return;
    }

    // For base64 data URLs, return directly or save to public uploads
    res.json({
      url: dataUrl,
      filename: filename || 'uploaded_image.jpg'
    });
  });

  // Health check endpoint for hosting platforms like Render
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  // Vite Integration & Static Serving
  const distPath = path.resolve(__dirname, 'dist');
  const hasDist = fs.existsSync(path.join(distPath, 'index.html'));

  if (hasDist || process.env.NODE_ENV === 'production') {
    console.log('Serving production static build from:', distPath);
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.sendFile(path.resolve(__dirname, 'index.html'));
      }
    });
  } else {
    console.log('Starting Vite development middleware');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
    app.get('*', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Vitalora Health server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
