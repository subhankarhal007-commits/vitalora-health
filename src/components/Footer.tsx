import React, { useState } from 'react';
import { Logo } from './Logo.tsx';
import { ShieldCheck, Mail, ArrowRight, HeartHandshake, CheckCircle2 } from 'lucide-react';

interface FooterProps {
  onOpenPage: (slug: 'about-us' | 'contact-us' | 'privacy-policy' | 'terms-and-conditions' | 'medical-disclaimer' | 'affiliate-disclosure') => void;
  onOpenAdmin: () => void;
  isAdminLoggedIn: boolean;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenPage,
  onOpenAdmin,
  isAdminLoggedIn,
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setSubscribed(true);
      setEmailInput('');
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-emerald-900/40 mt-20 relative overflow-hidden">
      {/* Decorative ambient leaf watermark in footer */}
      <div className="absolute right-0 bottom-0 pointer-events-none opacity-[0.03] select-none text-emerald-400">
        <svg width="400" height="400" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="inline-block bg-white/5 p-2 rounded-2xl border border-white/10">
              <Logo showTagline={true} />
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Empowering individuals with evidence-based lifestyle medicine, clinical nutrition research, and restorative biological rituals for enduring healthspan.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Medically vetted, fact-checked, and independent.</span>
            </div>
          </div>

          {/* Editorial & Legal Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              About & Editorial
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => onOpenPage('about-us')}
                  className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenPage('contact-us')}
                  className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
                >
                  Contact Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenPage('medical-disclaimer')}
                  className="hover:text-emerald-400 transition-colors text-left cursor-pointer flex items-center gap-1.5"
                >
                  <span>Medical Disclaimer</span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800/60">Important</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenPage('affiliate-disclosure')}
                  className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
                >
                  Affiliate Disclosure
                </button>
              </li>
            </ul>
          </div>

          {/* Policy & Trust Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Policies & Compliance
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => onOpenPage('privacy-policy')}
                  className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenPage('terms-and-conditions')}
                  className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
                >
                  Terms and Conditions
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenAdmin}
                  className="text-xs text-slate-400 hover:text-emerald-300 transition-colors pt-2 block cursor-pointer"
                >
                  {isAdminLoggedIn ? '⚡ Admin Dashboard' : '🔒 Admin Portal'}
                </button>
              </li>
            </ul>
          </div>

          {/* Weekly Health Digest Newsletter */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              The Vitalora Digest
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              One science-grounded protocol every Sunday morning. No ads or spam.
            </p>
            {subscribed ? (
              <div className="bg-emerald-950/80 border border-emerald-700/60 text-emerald-200 text-xs p-3 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>You are subscribed! Welcome to the Vitalora community.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full bg-slate-800 text-white placeholder-slate-500 text-xs rounded-xl pl-9 pr-3 py-2.5 border border-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span>Subscribe Free</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom Copyright & Medical Disclaimer Banner */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p className="text-center md:text-left">
            © {new Date().getFullYear()} <strong className="text-slate-400 font-medium">Vitalora Health</strong>. All rights reserved. <em>Your Daily Guide to Better Health</em>.
          </p>

          <div className="flex items-center gap-4 text-slate-400 text-center">
            <span className="flex items-center gap-1.5">
              <HeartHandshake className="w-3.5 h-3.5 text-emerald-500" />
              <span>Evidence-Based Practice</span>
            </span>
            <span>•</span>
            <button
              onClick={() => onOpenPage('medical-disclaimer')}
              className="text-slate-400 hover:text-emerald-400 underline decoration-slate-600 cursor-pointer"
            >
              Medical Disclaimer
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
