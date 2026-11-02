import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Vitalora Health uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-emerald-50/50 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white p-8 rounded-3xl border border-emerald-100 shadow-xl max-w-md w-full space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto text-xl font-bold">
              🌿
            </div>
            <h2 className="text-xl font-bold text-slate-800 font-serif">Vitalora Health</h2>
            <p className="text-xs text-slate-500">
              A temporary display error occurred. Tap below to reload.
            </p>
            {this.state.error && (
              <p className="text-[11px] text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100 break-words font-mono text-left">
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={() => {
                localStorage.removeItem('vitalora_deleted_ids');
                window.location.reload();
              }}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Refresh Portal
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

