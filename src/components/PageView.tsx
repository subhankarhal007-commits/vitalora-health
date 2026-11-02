import React, { useEffect, useState } from 'react';
import { FooterPage } from '../types/index.ts';
import { fetchPage } from '../lib/api.ts';
import { ArrowLeft, Calendar, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';

interface PageViewProps {
  slug: 'about-us' | 'contact-us' | 'privacy-policy' | 'terms-and-conditions' | 'medical-disclaimer' | 'affiliate-disclosure';
  onBack: () => void;
  onOpenAdmin: () => void;
  isAdminLoggedIn: boolean;
}

export const PageView: React.FC<PageViewProps> = ({
  slug,
  onBack,
  onOpenAdmin,
  isAdminLoggedIn,
}) => {
  const [page, setPage] = useState<FooterPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setLoading(true);
    fetchPage(slug)
      .then((data) => {
        setPage(data);
        setError(null);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load page');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug]);

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back navigation */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 hover:text-emerald-950 bg-white border border-emerald-200 px-4 py-2 rounded-full shadow-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </button>

          {isAdminLoggedIn && (
            <button
              onClick={onOpenAdmin}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 cursor-pointer"
            >
              ✏️ Edit this page in Admin
            </button>
          )}
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-emerald-100 shadow-sm flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            <p className="text-sm text-slate-500">Loading page information...</p>
          </div>
        ) : error || !page ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-red-100 shadow-sm">
            <p className="text-red-600 font-semibold mb-2">Error loading page</p>
            <p className="text-sm text-slate-500">{error}</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-6 sm:p-12 border border-emerald-100 shadow-sm">
            {/* Page Header */}
            <div className="border-b border-emerald-100 pb-8 mb-8">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Vitalora Health Official Policy & Info</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
                {page.title}
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>Last updated: {page.lastUpdated}</span>
              </div>
            </div>

            {/* Content */}
            <div
              className="article-content"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />

            {/* Trust Footer */}
            <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-800 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Vitalora Health Certified Editorial Integrity
              </span>
              <span>Document Ref: VTL-{slug.toUpperCase()}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
