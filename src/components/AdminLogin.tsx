import React, { useState } from 'react';
import { loginAdminWithGoogle } from '../lib/api.ts';
import { PRIMARY_ADMIN_EMAIL } from '../firebase.ts';
import { Shield, ArrowRight, Loader2, Lock, AlertCircle } from 'lucide-react';

interface AdminLoginProps {
  onSuccess: (admin: any) => void;
  onCancel: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);

    try {
      const admin = await loginAdminWithGoogle();
      onSuccess(admin);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed before completing login. Please try again.');
      } else if (code === 'auth/unauthorized-domain') {
        setError(
          `This domain (${window.location.hostname}) is not yet added to Firebase Auth Authorized Domains. Open Firebase Console → Authentication → Settings → Authorized domains and add "${window.location.hostname}".`
        );
      } else {
        setError(err?.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-emerald-100 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-44 h-44 rounded-full bg-emerald-100/60 blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-3 mb-6 relative z-10">
          <div className="inline-flex p-3.5 rounded-2xl bg-emerald-50 text-emerald-700 mb-1 border border-emerald-200 shadow-xs">
            <Shield className="w-7 h-7 text-emerald-600" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-slate-900">
            Vitalora Admin Control
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            Secured by Firebase Authentication. Sign in with your authorized administrator Google account to manage articles, drafts, and site pages.
          </p>
        </div>

        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-xl flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        <div className="space-y-4 relative z-10">
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 flex items-center gap-3 text-xs text-emerald-900">
            <Lock className="w-4 h-4 text-emerald-700 shrink-0" />
            <div>
              <span className="font-bold block text-emerald-900">Authorized Owner Access</span>
              <span className="text-[11px] text-emerald-700 font-mono">{PRIMARY_ADMIN_EMAIL}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm py-3.5 px-4 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in with Google...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                  />
                  <path
                    fill="#34A853"
                    d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.615 24 12.255 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.64 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                  />
                </svg>
                <span>Sign in with Google</span>
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
      </div>
    </div>
  );
};
