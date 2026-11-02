import React, { useState, useEffect } from 'react';
import { Article, FooterPage } from './types/index.ts';
import { fetchArticles, verifyAdminSession, deleteArticle, removeAdminToken } from './lib/api.ts';
import { Header } from './components/Header.tsx';
import { Footer } from './components/Footer.tsx';
import { ArticleCard } from './components/ArticleCard.tsx';
import { ArticleReader } from './components/ArticleReader.tsx';
import { PageView } from './components/PageView.tsx';
import { AdminLogin } from './components/AdminLogin.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import {
  Sparkles,
  Leaf,
  ShieldCheck,
  CheckCircle2,
  Search,
  BookOpen,
  Loader2,
  PlusCircle,
  LayoutDashboard,
  LogOut,
  ShieldAlert
} from 'lucide-react';

export default function App() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Routing State: home, article, page, admin, or admin-login
  const [currentView, setCurrentView] = useState<'home' | 'article' | 'page' | 'admin' | 'admin-login'>('home');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [selectedPageSlug, setSelectedPageSlug] = useState<FooterPage['slug']>('about-us');

  // Admin Auth & Editor State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminInitialTab, setAdminInitialTab] = useState<'articles' | 'editor' | 'pages'>('articles');
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [isNewlyPublished, setIsNewlyPublished] = useState(false);
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastNotification(msg);
    setTimeout(() => setToastNotification(null), 4000);
  };

  const isExplicitAdminUrl = () => {
    const path = window.location.pathname.toLowerCase();
    const searchParams = new URLSearchParams(window.location.search);
    return (
      path === '/admin' ||
      path === '/admin/' ||
      path === '/vitalora-admin' ||
      path === '/vitalora-admin/' ||
      searchParams.has('admin') ||
      searchParams.get('view') === 'admin'
    );
  };

  // Check admin session on mount
  useEffect(() => {
    verifyAdminSession().then((loggedIn) => {
      setIsAdminLoggedIn(loggedIn);
      if (isExplicitAdminUrl()) {
        if (loggedIn) {
          setCurrentView('admin');
        } else {
          setCurrentView('admin-login');
        }
      }
    });
  }, []);

  // Handle URL Sync (Back/Forward and direct bookmarking)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      const searchParams = new URLSearchParams(window.location.search);
      const articleSlug = searchParams.get('article');
      const pageSlug = searchParams.get('page');

      if (isExplicitAdminUrl()) {
        if (isAdminLoggedIn) {
          setCurrentView('admin');
        } else {
          setCurrentView('admin-login');
        }
      } else if (articleSlug) {
        const found = articles.find(a => a.slug === articleSlug || a.id === articleSlug);
        if (found) {
          setSelectedArticle(found);
          setCurrentView('article');
        }
      } else if (pageSlug) {
        setSelectedPageSlug(pageSlug as any);
        setCurrentView('page');
      } else {
        setCurrentView('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [articles, isAdminLoggedIn]);

  // Load articles
  const loadArticles = async () => {
    setLoading(true);
    try {
      const data = await fetchArticles();
      setArticles(data);

      // Check URL parameters for direct link navigation
      const searchParams = new URLSearchParams(window.location.search);
      const articleSlug = searchParams.get('article');
      const pageSlug = searchParams.get('page');

      if (!isExplicitAdminUrl()) {
        if (articleSlug) {
          const target = data.find(a => a.slug === articleSlug || a.id === articleSlug);
          if (target) {
            setSelectedArticle(target);
            setCurrentView('article');
          }
        } else if (pageSlug) {
          setSelectedPageSlug(pageSlug as any);
          setCurrentView('page');
        }
      }
    } catch (err) {
      console.error('Error fetching articles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  // Navigation Handlers with URL updating
  const handleNavigateHome = () => {
    setCurrentView('home');
    setSelectedArticle(null);
    setIsNewlyPublished(false);
    window.history.pushState({}, '', '/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectArticle = (article: Article) => {
    setSelectedArticle(article);
    setIsNewlyPublished(false);
    setCurrentView('article');
    window.history.pushState({}, '', `/?article=${encodeURIComponent(article.slug)}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenPage = (slug: FooterPage['slug']) => {
    setSelectedPageSlug(slug);
    setCurrentView('page');
    window.history.pushState({}, '', `/?page=${encodeURIComponent(slug)}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAdminEditor = (articleToEdit?: Article) => {
    if (articleToEdit) {
      setEditingArticle(articleToEdit);
    } else {
      setEditingArticle(null);
    }
    setAdminInitialTab('editor');
    setCurrentView('admin');
    window.history.pushState({}, '', '/admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAdminDashboard = () => {
    setEditingArticle(null);
    setAdminInitialTab('articles');
    setCurrentView('admin');
    window.history.pushState({}, '', '/admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // POST REMOVAL / DELETION HANDLER
  const handleDeleteArticle = async (article: Article) => {
    try {
      await deleteArticle(article.id);
      showToast(`"${article.title}" was removed successfully.`);
      await loadArticles();
      if (currentView === 'article' && selectedArticle?.id === article.id) {
        handleNavigateHome();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to remove article');
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    setCurrentView('admin');
    window.history.pushState({}, '', '/admin');
    showToast('Signed in successfully. Full control panel ready.');
    loadArticles();
  };

  const handleAdminLogout = () => {
    removeAdminToken();
    setIsAdminLoggedIn(false);
    setCurrentView('home');
    window.history.pushState({}, '', '/');
    showToast('Signed out of Admin Mode');
    loadArticles();
  };

  // Filter articles based on activeCategory and searchQuery
  const filteredArticles = articles.filter((art) => {
    if (activeCategory !== 'All' && art.category.toLowerCase() !== activeCategory.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        art.title.toLowerCase().includes(q) ||
        art.excerpt.toLowerCase().includes(q) ||
        art.category.toLowerCase().includes(q) ||
        (art.tags && art.tags.some(t => t.toLowerCase().includes(q)))
      );
    }
    return true;
  });

  const featuredArticle = filteredArticles.length > 0 ? filteredArticles[0] : null;
  const remainingArticles = filteredArticles.slice(1);

  // VIEW 1: Dedicated Admin Dashboard (when logged in and on admin view)
  if (currentView === 'admin' && isAdminLoggedIn) {
    return (
      <AdminDashboard
        onLogout={handleAdminLogout}
        initialTab={adminInitialTab}
        initialEditingArticle={editingArticle}
        onViewLiveArticle={(art, isJustPublished) => {
          setSelectedArticle(art);
          setIsNewlyPublished(!!isJustPublished);
          setCurrentView('article');
          window.history.pushState({}, '', `/?article=${encodeURIComponent(art.slug)}`);
          loadArticles();
        }}
        onViewLivePage={(slug) => {
          setSelectedPageSlug(slug);
          setCurrentView('page');
          window.history.pushState({}, '', `/?page=${encodeURIComponent(slug)}`);
        }}
        onExitToSite={handleNavigateHome}
      />
    );
  }

  // VIEW 2: Dedicated Admin Login Gateway (when accessing /admin or ?admin unauthenticated)
  if (currentView === 'admin-login' || (currentView === 'admin' && !isAdminLoggedIn)) {
    return (
      <AdminLogin
        onSuccess={handleAdminLoginSuccess}
        onCancel={handleNavigateHome}
      />
    );
  }

  // VIEW 3: Public Website (with optional floating admin toolbar if admin session is active)
  return (
    <div className="leaf-pattern-bg min-h-screen flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-950">
      {/* Toast Notification */}
      {toastNotification && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold border border-slate-700 animate-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastNotification}</span>
        </div>
      )}

      {/* FLOATING ADMIN PRIVILEGED BAR - ONLY VISIBLE TO LOGGED IN ADMIN */}
      {isAdminLoggedIn && (
        <aside aria-label="Admin bar" className="bg-slate-950 text-slate-200 border-b border-emerald-900/60 px-4 py-2 text-xs sticky top-0 z-50 shadow-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-white text-xs tracking-wide">
                🌿 Vitalora Admin Mode Active
              </span>
              <span className="text-slate-400 hidden sm:inline text-[11px]">
                (Private to you: manage posts, edits & controls)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenAdminEditor()}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Write New Post</span>
              </button>

              <button
                onClick={handleOpenAdminDashboard}
                className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs px-3 py-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400" />
                <span>Admin Dashboard</span>
              </button>

              <button
                onClick={handleAdminLogout}
                className="inline-flex items-center gap-1 text-slate-400 hover:text-red-400 px-2 py-1 text-xs font-medium transition-colors cursor-pointer"
                title="Sign out of admin mode"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Public Header - Clean with no public admin buttons */}
      <Header
        activeCategory={activeCategory}
        onSelectCategory={(cat) => {
          setActiveCategory(cat);
          if (currentView !== 'home') {
            handleNavigateHome();
          }
        }}
        onNavigateHome={handleNavigateHome}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Content Router */}
      <main className="flex-1">
        {currentView === 'article' && selectedArticle ? (
          <ArticleReader
            article={selectedArticle}
            relatedArticles={articles.filter(
              a => a.id !== selectedArticle.id && a.category === selectedArticle.category
            )}
            onBack={handleNavigateHome}
            onSelectArticle={handleSelectArticle}
            onCategoryClick={(cat) => {
              setActiveCategory(cat);
              handleNavigateHome();
            }}
            isAdminLoggedIn={isAdminLoggedIn}
            onDeleteArticle={handleDeleteArticle}
            onEditArticle={(art) => handleOpenAdminEditor(art)}
            isNewlyPublished={isNewlyPublished}
          />
        ) : currentView === 'page' ? (
          <PageView
            slug={selectedPageSlug}
            onBack={handleNavigateHome}
            onOpenAdmin={handleOpenAdminDashboard}
            isAdminLoggedIn={isAdminLoggedIn}
          />
        ) : (
          /* HOMEPAGE VIEW */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-10">

            {/* SEARCH / FILTER ACTIVE INDICATOR */}
            {(searchQuery || activeCategory !== 'All') && (
              <div className="bg-emerald-100/70 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-900">
                  <Search className="w-4 h-4 text-emerald-700" />
                  <span>
                    Showing articles for:{' '}
                    {searchQuery && (
                      <strong className="text-emerald-950 font-bold">"{searchQuery}"</strong>
                    )}
                    {searchQuery && activeCategory !== 'All' && ' in '}
                    {activeCategory !== 'All' && (
                      <span className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-md font-semibold">
                        {activeCategory}
                      </span>
                    )}
                    {' '}({filteredArticles.length} found)
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('All');
                  }}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            )}

            {/* ARTICLES SECTION */}
            {loading ? (
              <div className="bg-white rounded-3xl p-16 text-center border border-emerald-100 shadow-xs flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                <p className="text-sm font-semibold text-slate-600">
                  Curating latest clinical health publications...
                </p>
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="bg-white rounded-3xl p-16 text-center border border-emerald-100 shadow-xs space-y-4">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-serif text-xl font-bold text-slate-800">
                  No health articles match your search
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try searching for general wellness terms like "nutrition", "sleep", "heart", or clear your category filter.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setActiveCategory('All');
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-full cursor-pointer"
                  >
                    View All Articles
                  </button>
                  {isAdminLoggedIn && (
                    <button
                      onClick={() => handleOpenAdminEditor()}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 px-4 py-2 rounded-full cursor-pointer shadow-xs"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Write First Post</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-12">
                {/* 1. LARGE FEATURED HERO ARTICLE */}
                {featuredArticle && !searchQuery && activeCategory === 'All' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <h2 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                          Editor's Lead Feature
                        </h2>
                      </div>
                      <span className="text-xs text-slate-400 font-medium">Updated Daily</span>
                    </div>

                    <ArticleCard
                      article={featuredArticle}
                      onReadMore={handleSelectArticle}
                      featured={true}
                      isAdminLoggedIn={isAdminLoggedIn}
                      onDelete={handleDeleteArticle}
                      onEdit={(art) => handleOpenAdminEditor(art)}
                    />
                  </div>
                )}

                {/* 2. MAIN HEALTH ARTICLES GRID */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-emerald-200/60 pb-4">
                    <div className="flex items-center gap-2">
                      <Leaf className="w-4 h-4 text-emerald-700" />
                      <h2 className="font-serif text-2xl font-bold text-slate-900">
                        {activeCategory === 'All' ? 'Latest Health Articles' : `${activeCategory} Articles`}
                      </h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 font-medium">
                        {filteredArticles.length} {filteredArticles.length === 1 ? 'Article' : 'Articles'}
                      </span>
                      {isAdminLoggedIn && (
                        <button
                          onClick={() => handleOpenAdminEditor()}
                          className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Add Post</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {(featuredArticle && !searchQuery && activeCategory === 'All'
                      ? remainingArticles
                      : filteredArticles
                    ).map((art) => (
                      <ArticleCard
                        key={art.id}
                        article={art}
                        onReadMore={handleSelectArticle}
                        isAdminLoggedIn={isAdminLoggedIn}
                        onDelete={handleDeleteArticle}
                        onEdit={(target) => handleOpenAdminEditor(target)}
                      />
                    ))}
                  </div>
                </div>

                {/* CLINICAL STANDARDS BANNER */}
                <section className="bg-white rounded-3xl border border-emerald-100 p-8 sm:p-10 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                      <ShieldCheck className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-serif text-xl font-bold text-slate-900">
                        The Vitalora Health Editorial Standard
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                        Our content is grounded in evidence-based health research, clinical studies, and practical wellness protocols. We cite primary scientific literature and reject commercial bias.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenPage('about-us')}
                    className="shrink-0 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-5 py-2.5 rounded-full transition-colors cursor-pointer"
                  >
                    Read Our Editorial Policy
                  </button>
                </section>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer on every page - completely clean without admin link */}
      <Footer onOpenPage={handleOpenPage} />
    </div>
  );
}
