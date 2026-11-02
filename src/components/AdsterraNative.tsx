import React, { useId } from 'react';

interface AdsterraNativeProps {
  className?: string;
}

export const AdsterraNative: React.FC<AdsterraNativeProps> = ({ className = '' }) => {
  const id = useId();

  // Strictly block ads from rendering in any admin view or admin URL
  if (typeof window !== 'undefined') {
    const path = window.location.pathname.toLowerCase();
    const search = window.location.search.toLowerCase();
    if (path.includes('admin') || search.includes('admin')) {
      return null;
    }
  }

  const srcDoc = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { box-sizing: border-box; }
        html, body {
          margin: 0;
          padding: 8px;
          width: 100%;
          min-height: 100%;
          background: transparent;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        #container-0cf06b2ff9299b7f627ee1e3b4b8e765 {
          width: 100% !important;
          display: block;
        }
      </style>
    </head>
    <body>
      <div id="container-0cf06b2ff9299b7f627ee1e3b4b8e765"></div>
      <script async="async" data-cfasync="false" src="https://bauval.org/21/0cf06b2ff9299b7f627ee1e3b4b8e765"></script>
    </body>
    </html>
  `;

  return (
    <div className={`w-full bg-emerald-50/60 rounded-3xl border border-emerald-200/80 p-4 sm:p-6 my-8 shadow-xs ${className}`}>
      <div className="flex items-center justify-between mb-3 border-b border-emerald-100 pb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">
          Sponsored Recommendations
        </span>
        <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold bg-white px-2 py-0.5 rounded-md border border-emerald-100">
          Ad
        </span>
      </div>
      <div className="w-full min-h-[180px] rounded-2xl overflow-hidden bg-white shadow-2xs">
        <iframe
          title={`ad-native-${id}`}
          srcDoc={srcDoc}
          className="w-full min-h-[180px] border-0"
          style={{ width: '100%', minHeight: '180px', border: 'none', display: 'block' }}
          scrolling="no"
        />
      </div>
    </div>
  );
};
