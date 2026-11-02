import React, { useState } from 'react';
import { Logo } from './Logo.tsx';
import { HEALTH_CATEGORIES } from '../lib/constants.ts';
import { Search, Shield, Menu, X, Sparkles, BookOpen, Compass } from 'lucide-react';

interface HeaderProps {
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  onNavigateHome: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeCategory,
  onSelectCategory,
  onNavigateHome,
  searchQuery,
  onSearchChange,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-emerald-100/80 shadow-xs">
      {/* Top micro announcement bar */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white text-xs py-1.5 px-4 text-center">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="hidden sm:flex items-center gap-2 text-emerald-100 font-medium text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>Evidence-Based Medicine • Clinically Reviewed Daily</span>
          </div>
          <div className="mx-auto sm:mx-0 flex items-center gap-4 text-[11px] text-emerald-100">
            <span>Volume IV • Issue 42</span>
            <span className="hidden md:inline">•</span>
            <span>Evidence-Based Practice</span>
          </div>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo with Tagline */}
          <Logo onClick={onNavigateHome} />

          {/* Desktop Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-700/60" />
              <input
                type="text"
                placeholder="Search clinical topics, diets, biomarkers..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-emerald-50/60 hover:bg-emerald-50 focus:bg-white text-slate-800 placeholder-emerald-900/40 rounded-full border border-emerald-200/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2.5">
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-800 hover:text-emerald-900 rounded-full hover:bg-emerald-50 transition-colors cursor-pointer border border-emerald-200/60"
            >
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>Explore Articles</span>
            </button>
          </div>

          {/* Mobile buttons */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 text-emerald-800 hover:bg-emerald-50 rounded-lg cursor-pointer"
              aria-label="Toggle search"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-emerald-800 hover:bg-emerald-50 rounded-lg cursor-pointer"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile search drop */}
        {isSearchOpen && (
          <div className="md:hidden pb-3 pt-1">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-700/60" />
              <input
                type="text"
                placeholder="Search health articles, nutrition..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                autoFocus
                className="w-full pl-10 pr-4 py-2 text-sm bg-emerald-50 text-slate-800 placeholder-emerald-900/40 rounded-full border border-emerald-200 outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>
        )}

        {/* Category Navigation Bar */}
        <div className="hidden md:flex items-center gap-1 overflow-x-auto py-2.5 border-t border-emerald-100/60 scrollbar-none">
          <span className="text-xs font-semibold text-emerald-900/50 uppercase tracking-wider mr-2 flex items-center gap-1 shrink-0">
            <Compass className="w-3.5 h-3.5" />
            Categories:
          </span>
          {HEALTH_CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  onSelectCategory(cat);
                  onNavigateHome();
                }}
                className={`text-xs font-medium px-3.5 py-1.5 rounded-full transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30 font-semibold'
                    : 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-50'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-emerald-200 px-4 pt-3 pb-6 space-y-4 shadow-lg animate-in slide-in-from-top duration-200">
          <div>
            <div className="text-xs font-bold text-emerald-900/60 uppercase tracking-wider mb-2">
              Browse Health Categories
            </div>
            <div className="flex flex-wrap gap-1.5">
              {HEALTH_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    onSelectCategory(cat);
                    setIsMobileMenuOpen(false);
                    onNavigateHome();
                  }}
                  className={`text-xs px-3 py-1.5 rounded-full cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-emerald-600 text-white font-medium'
                      : 'bg-emerald-50/70 text-slate-700 hover:bg-emerald-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
