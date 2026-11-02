import React, { useState } from 'react';
import { loginAdmin, setAdminToken } from '../lib/api.ts';
import { Shield, Lock, Mail, ArrowRight, Loader2, Sparkles, KeyRound } from 'lucide-react';
import { Logo } from './Logo.tsx';

interface AdminLoginProps {
  onSuccess: (admin: any) => void;
  onCancel: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onCancel }) => {
  const [email, setEmail] = useState('admin@vitalorahealth.com');
  const [password, setPassword] = useState('vitalora2026!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await loginAdmin(email, password);
      setAdminToken(data.token);
      onSuccess(data.admin);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('admin@vitalorahealth.com');
    setPassword('vitalora2026!');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-emerald-100 relative overflow-hidden">
        {/* Subtle decorative background gradient */}
        <div className="absolute -right-16 -top-16 w-44 h-44 rounded-full bg-emerald-100/60 blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-3 mb-6 relative z-10">
          <div className="inline-flex p-3 rounded-2xl bg-emerald-50 text-emerald-700 mb-1 border border-emerald-200 shadow-xs">
            <Shield className="w-7 h-7 text-emerald-600" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-slate-900">
            Vitalora Admin Portal
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            Secure editorial access to publish, update, and manage articles and policy pages.
          </p>
        </div>

        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@vitalorahealth.com"
                className="w-full bg-slate-50 text-slate-900 text-sm rounded-xl pl-10 pr-4 py-2.5 border border-slate-200 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-50 text-slate-900 text-sm rounded-xl pl-10 pr-4 py-2.5 border border-slate-200 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              />
            </div>
          </div>

          {/* Quick Demo Helper Box */}
          <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-xl p-3 text-xs flex items-center justify-between text-emerald-900">
            <div className="space-y-0.5">
              <span className="font-semibold block flex items-center gap-1 text-[11px] text-emerald-800">
                <KeyRound className="w-3 h-3" /> Default Credentials:
              </span>
              <span className="text-[10px] text-emerald-700 font-mono">
                admin@vitalorahealth.com / vitalora2026!
              </span>
            </div>
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-[11px] font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border border-emerald-300 shadow-xs hover:bg-emerald-50 transition-colors cursor-pointer"
            >
              Autofill
            </button>
          </div>

          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Admin Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="w-full text-slate-500 hover:text-slate-700 text-xs font-semibold py-2 transition-colors cursor-pointer"
            >
              Return to Website
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
