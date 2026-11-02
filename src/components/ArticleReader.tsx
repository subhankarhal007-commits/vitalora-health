import React, { useState, useEffect } from 'react';
import { Article } from '../types/index.ts';
import { recordArticleView } from '../lib/api.ts';
import { AdsterraBanner } from './AdsterraBanner.tsx';
import { AdsterraNative } from './AdsterraNative.tsx';
import {
  Calendar,
  Clock,
  ArrowLeft,
  Share2,
  Bookmark,
  Check,
  ShieldCheck,
  Printer,
  ChevronRight,
  Sparkles,
  Eye,
  Tag,
  Trash2,
  FileEdit,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

interface ArticleReaderProps {
  article: Article;
  relatedArticles: Article[];
  onBack: () => void;
  onSelectArticle: (article: Article) => void;
  onCategoryClick: (category: string) => void;
  isAdminLoggedIn?: boolean;
  onDeleteArticle?: (article: Article) => void;
  onEditArticle?: (article: Article) => void;
  isNewlyPublished?: boolean;
}

export const ArticleReader: React.FC<ArticleReaderProps> = ({
  article,
  relatedArticles,
  onBack,
  onSelectArticle,
  onCategoryClick,
  isAdminLoggedIn = false,
  onDeleteArticle,
  onEditArticle,
  isNewlyPublished = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [isSaved, setIsSaved] = useState(false);
  const [toc, setToc] = useState<Array<{ id: string; text: string; level: number }>>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Parse Headings for Table of Contents
    const parser = new DOMParser();
    const doc = parser.parseFromString(article.content, 'text/html');
    const headings = doc.querySelectorAll('h2, h3');
    const items: Array<{ id: string; text: string; level: number }> = [];

    headings.forEach((heading, idx) => {
      const text = heading.textContent || `Section ${idx + 1}`;
      const id = `section-${idx}`;
      items.push({
        id,
        text,
        level: heading.tagName.toLowerCase() === 'h2' ? 2 : 3,
      });
    });
    setToc(items);

    // Record original reader view for genuine public visitors (never in admin preview)
    if (!isAdminLoggedIn) {
      recordArticleView(article.id).catch(() => {});
    }
  }, [article, isAdminLoggedIn]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const fontSizeClass =
    fontSize === 'xlarge'
      ? 'text-xl'
      : fontSize === 'large'
      ? 'text-lg'
      : 'text-base';

  return (
    <article className="min-h-screen pb-20">
      {/* Top Breadcrumb & Control Bar */}
      <div className="bg-white/80 backdrop-blur-md border-b border-emerald-100 py-3.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 hover:text-emerald-950 bg-emerald-50/80 hover:bg-emerald-100 px-3.5 py-1.5 rounded-full transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Articles</span>
          </button>

          {/* Admin Post Actions (Edit & Remove) */}
          {isAdminLoggedIn && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Admin:
              </span>
              {onEditArticle && (
                <button
                  type="button"
                  onClick={() => onEditArticle(article)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 px-2 py-0.5 rounded-md hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  <span>Edit Post</span>
                </button>
              )}
              {onDeleteArticle && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-800 px-2 py-0.5 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Post</span>
                </button>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs">
            {/* Font Size Selector */}
            <div className="hidden sm:flex items-center bg-slate-100 rounded-full p-1 border border-slate-200">
              <button
                onClick={() => setFontSize('normal')}
                title="Default text size"
                className={`px-2.5 py-0.5 rounded-full font-medium transition-colors cursor-pointer ${
                  fontSize === 'normal' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
                }`}
              >
                A
              </button>
              <button
                onClick={() => setFontSize('large')}
                title="Large text size"
                className={`px-2.5 py-0.5 rounded-full font-medium text-sm transition-colors cursor-pointer ${
                  fontSize === 'large' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
                }`}
              >
                A+
              </button>
              <button
                onClick={() => setFontSize('xlarge')}
                title="Extra large text size"
                className={`px-2.5 py-0.5 rounded-full font-medium text-base transition-colors cursor-pointer ${
                  fontSize === 'xlarge' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
                }`}
              >
                A++
              </button>
            </div>

            {/* Print button */}
            <button
              onClick={handlePrint}
              title="Print Article"
              className="hidden md:flex p-2 text-slate-500 hover:text-emerald-800 hover:bg-emerald-50 rounded-full transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Bookmark button */}
            <button
              onClick={() => setIsSaved(!isSaved)}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                isSaved
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'text-slate-500 hover:text-emerald-800 hover:bg-emerald-50'
              }`}
              title={isSaved ? 'Saved in reading list' : 'Save article'}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-emerald-600' : ''}`} />
            </button>

            {/* Share / Copy Link */}
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all shadow-xs cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Article Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* CELEBRATION BANNER IF JUST POSTED */}
        {isNewlyPublished && (
          <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-5 rounded-2xl mb-8 shadow-lg border border-emerald-500/50 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-300" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">
                  🎉 Your Post is Live on Vitalora Health!
                </h4>
                <p className="text-xs text-emerald-100">
                  You are now viewing your published article. Visitors can read and share it.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onBack}
                className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-950/60 hover:bg-emerald-950 text-emerald-200 rounded-xl transition-colors cursor-pointer border border-emerald-600"
              >
                Back to Feed
              </button>
              {onEditArticle && (
                <button
                  type="button"
                  onClick={() => onEditArticle(article)}
                  className="px-3.5 py-1.5 text-xs font-bold bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  Edit Post
                </button>
              )}
            </div>
          </div>
        )}

        {/* Category & Guide Badge - NO DOCTOR REFERENCES */}
        <div className="flex flex-wrap items-center gap-2.5 mb-4">
          <button
            onClick={() => onCategoryClick(article.category)}
            className="text-xs font-semibold px-3 py-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded-full transition-colors cursor-pointer"
          >
            {article.category}
          </button>

          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-900/80 bg-emerald-50/80 border border-emerald-200/80 px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Vitalora Health Publication</span>
          </span>
        </div>

        {/* Article Title */}
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-[1.18] tracking-tight mb-6">
          {article.title}
        </h1>

        {/* Lead Excerpt */}
        <p className="text-lg sm:text-xl text-slate-600 font-normal leading-relaxed border-l-4 border-emerald-500 pl-4 py-1 mb-8 bg-emerald-50/30 rounded-r-xl">
          {article.excerpt}
        </p>

        {/* Publication Metadata Card - CLEAN, NO DOCTOR NAMES */}
        <div className="bg-white rounded-2xl border border-emerald-100/90 p-4 sm:p-5 mb-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-serif font-bold text-base flex items-center justify-center ring-2 ring-emerald-200">
              V
            </div>
            <div>
              <span className="font-bold text-slate-900 text-sm">
                Vitalora Health
              </span>
              <p className="text-xs text-emerald-700/80 font-medium">Health & Wellness Editorial</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>Published {formatDate(article.publishedAt)}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>{article.readTime}</span>
            </div>
            {article.views > 0 && (
              <>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  <span>{article.views.toLocaleString()}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Large Featured Image */}
        <div className="mb-10 rounded-3xl overflow-hidden shadow-lg border border-emerald-100 bg-slate-900">
          <img
            src={article.featuredImage}
            alt={article.title}
            className="w-full h-auto max-h-[520px] object-cover"
          />
          {article.imageCaption && (
            <div className="bg-slate-900/90 text-slate-300 text-xs px-5 py-3 border-t border-slate-800 italic">
              Photo: {article.imageCaption}
            </div>
          )}
        </div>

        {/* Top Ad Unit (Leaderboard on Desktop, Mobile Banner on Phone) - Public Only */}
        {!isAdminLoggedIn && (
          <AdsterraBanner type="responsive-header" className="my-6" />
        )}

        {/* Quick Table of Contents (if multiple headings exist) */}
        {toc.length > 2 && (
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-5 mb-10 shadow-xs">
            <h3 className="font-serif font-bold text-emerald-950 text-base mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              In This Comprehensive Guide:
            </h3>
            <ul className="space-y-1.5 text-sm">
              {toc.map((item, i) => (
                <li key={i} className={`flex items-start gap-2 ${item.level === 3 ? 'ml-4' : ''}`}>
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-600 mt-1 shrink-0" />
                  <span className="text-emerald-900 font-medium hover:text-emerald-700 transition-colors">
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Full Formatted Article Content */}
        <div
          className={`article-content ${fontSizeClass} bg-white rounded-3xl p-6 sm:p-10 border border-emerald-100 shadow-xs`}
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Mid/Post Content Ad Unit (300x250 Rectangle) - Public Only */}
        {!isAdminLoggedIn && (
          <AdsterraBanner type="rectangle" className="my-8" />
        )}

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-8 pt-6 border-t border-emerald-100 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-1">
              <Tag className="w-3.5 h-3.5" />
              Topics:
            </span>
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-3 py-1 rounded-full font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Health Disclaimer Notice Box */}
        <div className="mt-10 bg-amber-50/80 border border-amber-200/80 rounded-2xl p-5 text-xs text-amber-900/90 leading-relaxed">
          <p className="font-bold text-amber-950 mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-700" />
            Vitalora Health Editorial Note:
          </p>
          <p>
            The health information provided in this article is for educational purposes only. Always consult a qualified professional before starting any new dietary or physical routine.
          </p>
        </div>

        {/* Adsterra Native Banner Unit (Sponsored Recommendations) - Public Only */}
        {!isAdminLoggedIn && (
          <AdsterraNative className="mt-10 mb-4" />
        )}

        {/* Related Articles Section */}
        {relatedArticles.length > 0 && (
          <div className="mt-16 pt-10 border-t border-emerald-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-2xl font-bold text-slate-900">
                Continue Reading in {article.category}
              </h3>
              <button
                onClick={() => onCategoryClick(article.category)}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
              >
                <span>View Category</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedArticles.slice(0, 3).map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => onSelectArticle(rel)}
                  className="group bg-white rounded-2xl border border-emerald-100 overflow-hidden shadow-xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer flex flex-col"
                >
                  <div className="h-40 overflow-hidden bg-slate-100">
                    <img
                      src={rel.featuredImage}
                      alt={rel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                    <span className="text-[11px] font-semibold text-emerald-700">
                      {rel.category} • {rel.readTime}
                    </span>
                    <h5 className="font-serif font-bold text-slate-900 group-hover:text-emerald-700 line-clamp-2 text-sm leading-snug">
                      {rel.title}
                    </h5>
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 pt-2">
                      <span>Read Guide</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Remove Post Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-red-200 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-serif font-bold text-slate-900 text-xl">
                Remove This Post?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to remove <strong className="text-slate-800">"{article.title}"</strong>? This will permanently delete the post from Vitalora Health.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  if (onDeleteArticle) {
                    onDeleteArticle(article);
                  }
                }}
                className="px-5 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs cursor-pointer"
              >
                Yes, Remove Post
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
};
