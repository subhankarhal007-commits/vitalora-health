import React, { useState, useEffect } from 'react';
import { Article, FooterPage, SiteStats } from '../types/index.ts';
import {
  fetchArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  fetchPages,
  updatePage,
  fetchSiteStats,
  removeAdminToken,
  clearDemoArticles,
  restoreDemoArticles,
} from '../lib/api.ts';
import { HEALTH_CATEGORIES, CURATED_HEALTH_IMAGES, AUTHOR_PRESETS } from '../lib/constants.ts';
import { VisualEditor } from './VisualEditor.tsx';
import { Logo } from './Logo.tsx';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  FileEdit,
  Trash2,
  Eye,
  LogOut,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
  Search,
  ExternalLink,
  Save,
  Check,
  FolderOpen,
  Sliders,
  ChevronRight,
  TrendingUp,
  FileCheck,
  RefreshCw,
  HelpCircle,
  X,
  AlertTriangle
} from 'lucide-react';

interface AdminDashboardProps {
  onLogout: () => void;
  onViewLiveArticle: (article: Article, isNewlyPublished?: boolean) => void;
  onViewLivePage: (slug: any) => void;
  onExitToSite: () => void;
  initialTab?: 'articles' | 'editor' | 'pages';
  initialEditingArticle?: Article | null;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onLogout,
  onViewLiveArticle,
  onViewLivePage,
  onExitToSite,
  initialTab = 'articles',
  initialEditingArticle = null,
}) => {
  const [activeTab, setActiveTab] = useState<'articles' | 'editor' | 'pages'>(initialTab);
  const [articles, setArticles] = useState<Article[]>([]);
  const [pages, setPages] = useState<FooterPage[]>([]);
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Articles Table Filter state
  const [articleFilter, setArticleFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchFilter, setSearchFilter] = useState('');

  // Article Form State
  const [editingArticleId, setEditingArticleId] = useState<string | null>(initialEditingArticle?.id || null);
  const [articleForm, setArticleForm] = useState({
    title: initialEditingArticle?.title || '',
    slug: initialEditingArticle?.slug || '',
    excerpt: initialEditingArticle?.excerpt || '',
    category: (initialEditingArticle?.category || 'Nutrition') as Article['category'],
    featuredImage: initialEditingArticle?.featuredImage || CURATED_HEALTH_IMAGES[0].url,
    imageCaption: initialEditingArticle?.imageCaption || CURATED_HEALTH_IMAGES[0].caption,
    content: initialEditingArticle?.content || '<h2>Introduction</h2><p>Provide a comprehensive overview of the health topic and current clinical research findings...</p><div class="callout-box"><p class="font-semibold text-emerald-800">Key Health Takeaway:</p><p>Summarize the most vital actionable step for the reader.</p></div><h2>Scientific Background & Evidence</h2><p>Detail the biological mechanism and key recommendations here...</p><ul><li>First key clinical guideline</li><li>Second evidence-based protocol</li></ul>',
    status: (initialEditingArticle?.status || 'published') as 'published' | 'draft',
    readTime: initialEditingArticle?.readTime || '5 min read',
    tagsString: initialEditingArticle?.tags ? initialEditingArticle.tags.join(', ') : 'Health, Wellness',
    author: initialEditingArticle?.author || AUTHOR_PRESETS[0],
  });

  // Pages Editor State
  const [selectedPageSlug, setSelectedPageSlug] = useState<string>('about-us');
  const [pageTitle, setPageTitle] = useState('');
  const [pageContent, setPageContent] = useState('');
  const [pageLastUpdated, setPageLastUpdated] = useState('');
  const [isSavingPage, setIsSavingPage] = useState(false);

  // Delete modal state
  const [deletingArticle, setDeletingArticle] = useState<Article | null>(null);

  // Gallery Picker modal
  const [showImageGalleryModal, setShowImageGalleryModal] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [arts, pgs, st] = await Promise.all([
        fetchArticles({ all: true }),
        fetchPages(),
        fetchSiteStats().catch(() => null),
      ]);
      setArticles(arts);
      setPages(pgs);
      setStats(st);

      // Pre-select first page if available
      if (pgs.length > 0) {
        const initialP = pgs.find(p => p.slug === selectedPageSlug) || pgs[0];
        setSelectedPageSlug(initialP.slug);
        setPageTitle(initialP.title);
        setPageContent(initialP.content);
        setPageLastUpdated(initialP.lastUpdated);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load admin data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (initialEditingArticle) {
      setEditingArticleId(initialEditingArticle.id);
      setArticleForm({
        title: initialEditingArticle.title,
        slug: initialEditingArticle.slug,
        excerpt: initialEditingArticle.excerpt,
        category: initialEditingArticle.category,
        featuredImage: initialEditingArticle.featuredImage,
        imageCaption: initialEditingArticle.imageCaption || '',
        content: initialEditingArticle.content,
        status: initialEditingArticle.status,
        readTime: initialEditingArticle.readTime,
        tagsString: initialEditingArticle.tags ? initialEditingArticle.tags.join(', ') : '',
        author: initialEditingArticle.author || AUTHOR_PRESETS[0],
      });
      setActiveTab('editor');
    }
  }, [initialEditingArticle]);

  const handleCreateNewClick = () => {
    setEditingArticleId(null);
    setArticleForm({
      title: '',
      slug: '',
      excerpt: '',
      category: 'Nutrition',
      featuredImage: CURATED_HEALTH_IMAGES[0].url,
      imageCaption: CURATED_HEALTH_IMAGES[0].caption,
      content: '<h2>Introduction</h2><p>Provide a comprehensive overview of the health topic and current clinical research findings...</p><div class="callout-box"><p class="font-semibold text-emerald-800">Key Health Takeaway:</p><p>Summarize the most vital actionable step for the reader.</p></div><h2>Scientific Background & Evidence</h2><p>Detail the biological mechanism and key recommendations here...</p><ul><li>First key clinical guideline</li><li>Second evidence-based protocol</li></ul>',
      status: 'published',
      readTime: '6 min read',
      tagsString: 'Health, Longevity, Wellness',
      author: AUTHOR_PRESETS[0],
    });
    setActiveTab('editor');
  };

  const handleEditClick = (article: Article) => {
    setEditingArticleId(article.id);
    setArticleForm({
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      category: article.category,
      featuredImage: article.featuredImage,
      imageCaption: article.imageCaption || '',
      content: article.content,
      status: article.status,
      readTime: article.readTime,
      tagsString: article.tags ? article.tags.join(', ') : '',
      author: article.author || AUTHOR_PRESETS[0],
    });
    setActiveTab('editor');
  };

  // POST ARTICLE & SHOW MY POST
  const handleSaveArticle = async (forcedStatus?: 'published' | 'draft') => {
    if (!articleForm.title.trim()) {
      showToast('Article title is required', 'error');
      return;
    }

    if (!articleForm.content.trim()) {
      showToast('Article content cannot be empty', 'error');
      return;
    }

    const statusToSave = forcedStatus || articleForm.status;
    const tagsArray = articleForm.tagsString
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    try {
      let savedArticle: Article;
      if (editingArticleId) {
        savedArticle = await updateArticle(editingArticleId, {
          title: articleForm.title,
          slug: articleForm.slug || undefined,
          excerpt: articleForm.excerpt,
          category: articleForm.category,
          featuredImage: articleForm.featuredImage,
          imageCaption: articleForm.imageCaption,
          content: articleForm.content,
          status: statusToSave,
          readTime: articleForm.readTime,
          tags: tagsArray,
          author: articleForm.author,
        });
        showToast(
          statusToSave === 'published'
            ? 'Article updated and published successfully!'
            : 'Draft updated and saved!'
        );
      } else {
        savedArticle = await createArticle({
          title: articleForm.title,
          slug: articleForm.slug || undefined,
          excerpt: articleForm.excerpt,
          category: articleForm.category,
          featuredImage: articleForm.featuredImage,
          imageCaption: articleForm.imageCaption,
          content: articleForm.content,
          status: statusToSave,
          readTime: articleForm.readTime,
          tags: tagsArray,
          author: articleForm.author,
        });
        showToast(
          statusToSave === 'published'
            ? 'New article published to the website!'
            : 'Article saved as draft!'
        );
      }

      await loadData();

      // WHEN I POST THEN SHOW MY POST:
      if (statusToSave === 'published') {
        onViewLiveArticle(savedArticle, true);
      } else {
        setActiveTab('articles');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save article', 'error');
    }
  };

  const handleTogglePublishStatus = async (article: Article) => {
    const nextStatus = article.status === 'published' ? 'draft' : 'published';
    try {
      await updateArticle(article.id, { status: nextStatus });
      showToast(`Article marked as ${nextStatus}!`);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update article status', 'error');
    }
  };

  // REMOVE POST CONFIRMATION
  const confirmDelete = async () => {
    if (!deletingArticle) return;
    try {
      await deleteArticle(deletingArticle.id);
      showToast(`"${deletingArticle.title}" was removed successfully.`);
      setDeletingArticle(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to remove article', 'error');
    }
  };

  // CLEAR ALL DEMO POSTS
  const handleClearDemoPosts = async () => {
    if (!window.confirm('Are you sure you want to remove the starter demo posts? Only your custom posts will be displayed on the website.')) {
      return;
    }
    try {
      const res = await clearDemoArticles();
      showToast(`Starter demo posts removed. (${res.remainingCount} custom articles remaining).`);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to clear demo posts', 'error');
    }
  };

  // RESTORE DEMO POSTS
  const handleRestoreDemoPosts = async () => {
    try {
      await restoreDemoArticles();
      showToast('Demo posts restored to the articles database!');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to restore demo posts', 'error');
    }
  };

  // Image Upload handler (supports local file upload converted to data URL)
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setArticleForm(prev => ({
        ...prev,
        featuredImage: result,
      }));
      showToast('Image uploaded and set as featured image!');
    };
    reader.readAsDataURL(file);
  };

  // Pages handling
  const handleSelectPage = (slug: string) => {
    setSelectedPageSlug(slug);
    const p = pages.find(item => item.slug === slug);
    if (p) {
      setPageTitle(p.title);
      setPageContent(p.content);
      setPageLastUpdated(p.lastUpdated);
    }
  };

  const handleSavePage = async () => {
    setIsSavingPage(true);
    try {
      await updatePage(selectedPageSlug, {
        title: pageTitle,
        content: pageContent,
      });
      showToast(`"${pageTitle}" updated and persisted to site!`);
      const updatedPages = await fetchPages();
      setPages(updatedPages);
    } catch (err: any) {
      showToast(err.message || 'Failed to save page', 'error');
    } finally {
      setIsSavingPage(false);
    }
  };

  // Filtered Articles List
  const filteredArticles = articles.filter(art => {
    if (articleFilter === 'published' && art.status !== 'published') return false;
    if (articleFilter === 'draft' && art.status !== 'draft') return false;
    if (categoryFilter !== 'All' && art.category !== categoryFilter) return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      return (
        art.title.toLowerCase().includes(q) ||
        art.excerpt.toLowerCase().includes(q) ||
        (art.tags && art.tags.some(t => t.toLowerCase().includes(q)))
      );
    }
    return true;
  });

  // Dynamic Real / Original Stats strictly computed from actual live database records (No demo / mock numbers)
  const realTotalArticles = articles.length;
  const realPublishedCount = articles.filter(art => art.status === 'published').length;
  const realDraftCount = articles.filter(art => art.status === 'draft').length;
  const realTotalViews = articles.reduce((acc, curr) => acc + (curr.views || 0), 0);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold transition-all animate-in slide-in-from-bottom ${
            toastMessage.type === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-emerald-800 text-white border border-emerald-600'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertCircle className="w-5 h-5 shrink-0" />
          ) : (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Admin Top Navigation Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center font-serif font-bold text-white text-base">
                V
              </span>
              <div>
                <span className="font-serif font-bold text-white text-base tracking-tight">Vitalora Health</span>
                <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-semibold ml-2 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  Admin Control
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onExitToSite}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span>View Public Website</span>
            </button>

            <button
              onClick={() => {
                removeAdminToken();
                onLogout();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-950/80 border border-red-900/60 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Admin Navigation Sub-tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('articles')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'articles'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Manage & Remove Posts ({articles.length})</span>
          </button>

          <button
            onClick={handleCreateNewClick}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'editor'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>{editingArticleId ? 'Edit Article' : 'Write & Publish Post'}</span>
          </button>

          <button
            onClick={() => setActiveTab('pages')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'pages'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileEdit className="w-4 h-4" />
            <span>Edit Footer Pages</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* STATS OVERVIEW CARDS (Visible on articles tab) - 100% REAL / ORIGINAL DATA */}
        {activeTab === 'articles' && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Total Articles
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-slate-900 font-serif">
                  {realTotalArticles}
                </span>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Original Records
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Live Published
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-emerald-700 font-serif">
                  {realPublishedCount}
                </span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Live on Site
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Saved Drafts
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-amber-600 font-serif">
                  {realDraftCount}
                </span>
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                  In Progress
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Total Reader Views
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-teal-800 font-serif">
                  {realTotalViews.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Real Visits
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: ARTICLES MANAGER */}
        {activeTab === 'articles' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-0">
            {/* Filter Bar with Quick Demo Clear & Write Post */}
            <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/50">
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                {/* Search */}
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by title or topic..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>

                {/* Status Filter */}
                <div className="flex items-center bg-white rounded-xl border border-slate-300 p-0.5">
                  {(['all', 'published', 'draft'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setArticleFilter(st)}
                      className={`text-xs capitalize font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        articleFilter === st
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                {/* Category Filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-700 focus:outline-none"
                >
                  <option value="All">All Categories</option>
                  {HEALTH_CATEGORIES.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                {/* Remove Demo Posts option */}
                <button
                  type="button"
                  onClick={handleClearDemoPosts}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors cursor-pointer"
                  title="Remove sample starter posts to keep only your custom posts"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Demo Posts</span>
                </button>

                <button
                  type="button"
                  onClick={handleRestoreDemoPosts}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  title="Restore sample demo articles"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Restore Demo</span>
                </button>

                <button
                  onClick={handleCreateNewClick}
                  className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Write New Post</span>
                </button>
              </div>
            </div>

            {/* Articles Table */}
            {filteredArticles.length === 0 ? (
              <div className="p-16 text-center text-slate-400 space-y-3">
                <FolderOpen className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-base font-semibold text-slate-600">No articles found</p>
                <p className="text-xs">Adjust your search filters or click "Write New Post" to publish an article.</p>
                <button
                  onClick={handleCreateNewClick}
                  className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-xl mt-2 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Write Your First Post</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Article</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Reads</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredArticles.map((art) => (
                      <tr key={art.id} className="hover:bg-emerald-50/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={art.featuredImage}
                              alt={art.title}
                              className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                            />
                            <div className="space-y-0.5">
                              <span className="font-serif font-bold text-slate-900 text-sm hover:text-emerald-700 line-clamp-1">
                                {art.title}
                              </span>
                              <span className="text-[11px] text-slate-400 block line-clamp-1">
                                {art.excerpt}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-slate-700 whitespace-nowrap">
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full text-[11px]">
                            {art.category}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {art.status === 'published' ? (
                            <button
                              onClick={() => handleTogglePublishStatus(art)}
                              title="Click to unpublish"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors cursor-pointer"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              <span>Published</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleTogglePublishStatus(art)}
                              title="Click to publish"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors cursor-pointer"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                              <span>Draft</span>
                            </button>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                          {art.publishedAt}
                        </td>

                        <td className="py-3.5 px-4 text-slate-700 font-semibold whitespace-nowrap">
                          {art.views?.toLocaleString() || 0}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            {art.status === 'published' && (
                              <button
                                onClick={() => onViewLiveArticle(art)}
                                title="View live page"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer border border-slate-200"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleEditClick(art)}
                              title="Edit article"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer border border-emerald-200"
                            >
                              <FileEdit className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            {/* Prominent Remove button */}
                            <button
                              onClick={() => setDeletingArticle(art)}
                              title="Remove post"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer border border-red-200 font-semibold"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ARTICLE VISUAL EDITOR */}
        {activeTab === 'editor' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-5 gap-4">
              <div>
                <span className="text-xs uppercase font-bold text-emerald-700 tracking-wider">
                  {editingArticleId ? 'Update Existing Article' : 'Compose New Article'}
                </span>
                <h2 className="font-serif text-2xl font-bold text-slate-900 mt-1">
                  {articleForm.title || 'Untitled Health Article'}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('articles')}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveArticle('draft')}
                  className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save as Draft</span>
                </button>

                {/* PUBLISH & SHOW MY POST BUTTON */}
                <button
                  type="button"
                  onClick={() => handleSaveArticle('published')}
                  className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                  <span>{editingArticleId ? 'Update & View Post' : 'Publish & View My Post'}</span>
                </button>
              </div>
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Title, Excerpt, Content */}
              <div className="lg:col-span-2 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Article Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Zone 2 Cardio: The Biological Engine Behind Mitochondrial Longevity"
                    value={articleForm.title}
                    onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                    className="w-full text-base font-serif font-bold text-slate-900 p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Excerpt / Lead Paragraph (Preview summary shown on homepage)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Brief 1-2 sentence compelling summary of the article..."
                    value={articleForm.excerpt}
                    onChange={(e) => setArticleForm({ ...articleForm, excerpt: e.target.value })}
                    className="w-full text-sm text-slate-700 p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>

                {/* Visual Text Editor */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Article Body (Headings, Paragraphs, Lists & Callouts) *
                    </label>
                    <span className="text-[11px] text-emerald-800 font-semibold">
                      Use the formatting toolbar below
                    </span>
                  </div>
                  <VisualEditor
                    value={articleForm.content}
                    onChange={(newContent) => setArticleForm({ ...articleForm, content: newContent })}
                  />
                </div>
              </div>

              {/* Right Column: Metadata, Featured Image, Category, Author */}
              <div className="space-y-6 bg-slate-50/70 p-5 rounded-2xl border border-slate-200">
                {/* Category & Read Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Category
                    </label>
                    <select
                      value={articleForm.category}
                      onChange={(e) => setArticleForm({ ...articleForm, category: e.target.value as any })}
                      className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl font-medium focus:border-emerald-600"
                    >
                      {HEALTH_CATEGORIES.filter(c => c !== 'All').map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Read Time
                    </label>
                    <input
                      type="text"
                      placeholder="6 min read"
                      value={articleForm.readTime}
                      onChange={(e) => setArticleForm({ ...articleForm, readTime: e.target.value })}
                      className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:border-emerald-600"
                    />
                  </div>
                </div>

                {/* Featured Image Management */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Featured Image
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowImageGalleryModal(true)}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                    >
                      Pick from Health Gallery
                    </button>
                  </div>

                  {/* Image Preview */}
                  <div className="relative rounded-2xl overflow-hidden border border-slate-300 h-44 mb-2 bg-slate-200">
                    <img
                      src={articleForm.featuredImage}
                      alt="Featured Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Local Upload or URL input */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="flex-1 inline-flex items-center justify-center gap-2 text-xs font-bold bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50 py-2 px-3 rounded-xl cursor-pointer transition-colors shadow-xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload File from Device</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <input
                      type="text"
                      placeholder="Or paste direct image URL (https://...)"
                      value={articleForm.featuredImage}
                      onChange={(e) => setArticleForm({ ...articleForm, featuredImage: e.target.value })}
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-xl focus:border-emerald-600"
                    />

                    <input
                      type="text"
                      placeholder="Image Caption / Photo Credit"
                      value={articleForm.imageCaption}
                      onChange={(e) => setArticleForm({ ...articleForm, imageCaption: e.target.value })}
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-xl focus:border-emerald-600"
                    />
                  </div>
                </div>

                {/* Author / Byline */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Author / Byline (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Vitalora Health"
                    value={articleForm.author?.name || 'Vitalora Health'}
                    onChange={(e) => {
                      setArticleForm({
                        ...articleForm,
                        author: {
                          name: e.target.value || 'Vitalora Health',
                          role: 'Editorial Team',
                          avatar: articleForm.author?.avatar || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=150&auto=format&fit=crop&q=80',
                        },
                      });
                    }}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:border-emerald-600 font-medium"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Default: Vitalora Health</p>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tags (Comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="Nutrition, Gut Health, Anti-Inflammatory"
                    value={articleForm.tagsString}
                    onChange={(e) => setArticleForm({ ...articleForm, tagsString: e.target.value })}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:border-emerald-600"
                  />
                </div>

                {/* Article Status & Slug */}
                <div className="pt-3 border-t border-slate-200 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Publication Status
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                        <input
                          type="radio"
                          name="status"
                          value="published"
                          checked={articleForm.status === 'published'}
                          onChange={() => setArticleForm({ ...articleForm, status: 'published' })}
                        />
                        <span className="text-emerald-800">Published (Live)</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer ml-3">
                        <input
                          type="radio"
                          name="status"
                          value="draft"
                          checked={articleForm.status === 'draft'}
                          onChange={() => setArticleForm({ ...articleForm, status: 'draft' })}
                        />
                        <span className="text-amber-800">Draft (Unpublished)</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      URL Slug (Auto-generated if left blank)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. zone-2-cardio-longevity"
                      value={articleForm.slug}
                      onChange={(e) => setArticleForm({ ...articleForm, slug: e.target.value })}
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-xl font-mono focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FOOTER PAGES MANAGER */}
        {activeTab === 'pages' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-5 gap-4">
              <div>
                <span className="text-xs uppercase font-bold text-emerald-700 tracking-wider">
                  Site Pages & Legal Disclaimers
                </span>
                <h2 className="font-serif text-2xl font-bold text-slate-900 mt-1">
                  Edit Site Pages Content
                </h2>
                <p className="text-xs text-slate-500">
                  Update About Us, Contact Us, Privacy Policy, Terms, Medical Disclaimer, and Affiliate Disclosure.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onViewLivePage(selectedPageSlug)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview Page Live</span>
                </button>

                <button
                  type="button"
                  onClick={handleSavePage}
                  disabled={isSavingPage}
                  className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingPage ? 'Saving Changes...' : 'Save Page Changes'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Pages Selector Sidebar */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Select Page to Edit
                </span>
                {pages.map((p) => {
                  const isSelected = selectedPageSlug === p.slug;
                  return (
                    <button
                      key={p.slug}
                      onClick={() => handleSelectPage(p.slug)}
                      className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-xs font-bold'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span>{p.title}</span>
                      <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                    </button>
                  );
                })}
              </div>

              {/* Page Editor Workspace */}
              <div className="lg:col-span-3 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Page Heading Title
                  </label>
                  <input
                    type="text"
                    value={pageTitle}
                    onChange={(e) => setPageTitle(e.target.value)}
                    className="w-full text-base font-serif font-bold text-slate-900 p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Page Content (Headings, Paragraphs, Lists & Contact Info)
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Last edited: {pageLastUpdated}
                    </span>
                  </div>
                  <VisualEditor
                    value={pageContent}
                    onChange={(newVal) => setPageContent(newVal)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deletingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-red-200 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-serif font-bold text-slate-900 text-xl">
                Remove Health Post?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to remove <strong className="text-slate-800 font-semibold">"{deletingArticle.title}"</strong>? This will permanently delete the post from Vitalora Health.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingArticle(null)}
                className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-5 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs cursor-pointer"
              >
                Yes, Remove Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Curated Health Gallery Picker Modal */}
      {showImageGalleryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 border border-emerald-200 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-serif font-bold text-slate-900 text-xl">
                  Curated Health Photo Gallery
                </h3>
                <p className="text-xs text-slate-500">
                  Select a high-resolution, royalty-free wellness image for this article.
                </p>
              </div>
              <button
                onClick={() => setShowImageGalleryModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 overflow-y-auto flex-1 p-1">
              {CURATED_HEALTH_IMAGES.map((img, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setArticleForm(prev => ({
                      ...prev,
                      featuredImage: img.url,
                      imageCaption: img.caption,
                    }));
                    setShowImageGalleryModal(false);
                    showToast('Featured image updated from gallery!');
                  }}
                  className="group relative rounded-2xl overflow-hidden border-2 border-transparent hover:border-emerald-500 cursor-pointer shadow-xs transition-all flex flex-col bg-slate-50"
                >
                  <img
                    src={img.url}
                    alt={img.title}
                    className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="p-2">
                    <span className="text-[10px] font-bold text-emerald-800 block line-clamp-1">
                      {img.title}
                    </span>
                    <span className="text-[9px] text-slate-400 block">
                      {img.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
