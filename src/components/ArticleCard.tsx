import React from 'react';
import { Article } from '../types/index.ts';
import { Clock, Calendar, ArrowRight, Trash2, FileEdit } from 'lucide-react';

interface ArticleCardProps {
  article: Article;
  onReadMore: (article: Article) => void;
  featured?: boolean;
  isAdminLoggedIn?: boolean;
  onDelete?: (article: Article) => void;
  onEdit?: (article: Article) => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  onReadMore,
  featured = false,
  isAdminLoggedIn = false,
  onDelete,
  onEdit,
}) => {
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (featured) {
    return (
      <article
        onClick={() => onReadMore(article)}
        className="group relative bg-white/95 rounded-3xl border border-emerald-100 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all duration-300 overflow-hidden cursor-pointer grid grid-cols-1 lg:grid-cols-12 gap-0"
      >
        {/* Large Featured Image */}
        <div className="lg:col-span-7 relative h-72 sm:h-96 lg:h-full min-h-[320px] overflow-hidden bg-emerald-950">
          <img
            src={article.featuredImage}
            alt={article.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent lg:hidden" />
          
          <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
            <span className="bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-md backdrop-blur-md">
              Featured Guide
            </span>
            <span className="bg-white/90 text-emerald-950 text-xs font-medium px-3 py-1.5 rounded-full shadow-sm backdrop-blur-md">
              {article.category}
            </span>
          </div>

          {/* Quick Admin Remove / Edit overlay */}
          {isAdminLoggedIn && (
            <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md p-1 rounded-xl shadow-md">
              {onEdit && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(article);
                  }}
                  title="Edit this post"
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <FileEdit className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(article);
                  }}
                  title="Remove this post"
                  className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/60 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Featured Content Area */}
        <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(article.publishedAt)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {article.readTime}
              </span>
            </div>

            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 group-hover:text-emerald-800 transition-colors leading-tight">
              {article.title}
            </h3>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed line-clamp-3 sm:line-clamp-4">
              {article.excerpt}
            </p>
          </div>

          <div className="pt-6 border-t border-emerald-50 mt-6 flex items-center justify-between">
            {/* Publication Source Badge - NO DOCTOR NAMES */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                Vitalora Health
              </span>
            </div>

            {/* Read More button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReadMore(article);
              }}
              className="inline-flex items-center gap-2 text-xs font-bold text-white bg-emerald-600 group-hover:bg-emerald-700 px-4 py-2.5 rounded-full transition-all shadow-xs group-hover:shadow-md cursor-pointer"
            >
              <span>Read Full Guide</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      onClick={() => onReadMore(article)}
      className="group bg-white rounded-3xl border border-emerald-100 shadow-xs hover:shadow-lg hover:border-emerald-300 transition-all duration-300 overflow-hidden flex flex-col cursor-pointer relative"
    >
      {/* Large Featured Image */}
      <div className="relative h-56 sm:h-64 overflow-hidden bg-slate-100">
        <img
          src={article.featuredImage}
          alt={article.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="bg-white/95 backdrop-blur-md text-emerald-800 text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-xs border border-emerald-200/50">
            {article.category}
          </span>
        </div>

        {/* Quick Admin Remove / Edit overlay */}
        {isAdminLoggedIn && (
          <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-slate-900/80 backdrop-blur-md p-1 rounded-xl shadow-md">
            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(article);
                }}
                title="Edit this post"
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <FileEdit className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(article);
                }}
                title="Remove this post"
                className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/60 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        <div className="absolute bottom-3 right-3">
          <span className="bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
            <Clock className="w-3 h-3 text-emerald-400" />
            {article.readTime}
          </span>
        </div>
      </div>

      {/* Body text & headings */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <span className="text-emerald-700 font-semibold">{formatDate(article.publishedAt)}</span>
            {article.views > 0 && (
              <>
                <span>•</span>
                <span>{article.views.toLocaleString()} reads</span>
              </>
            )}
          </div>

          <h3 className="font-serif text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug line-clamp-2">
            {article.title}
          </h3>

          <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">
            {article.excerpt}
          </p>
        </div>

        {/* Footer with publication badge and Read More - NO DOCTOR NAMES */}
        <div className="pt-5 border-t border-slate-100 mt-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full">
              Vitalora Health
            </span>
          </div>

          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 group-hover:text-emerald-800 transition-colors">
            <span>Read More</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </span>
        </div>
      </div>
    </article>
  );
};
