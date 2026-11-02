import React, { useId } from 'react';

interface AdsterraBannerProps {
  type: 'leaderboard' | 'rectangle' | 'mobile' | 'responsive-header' | 'responsive-footer';
  className?: string;
}

export const AdsterraBanner: React.FC<AdsterraBannerProps> = ({ type, className = '' }) => {
  const id = useId();

  // Strictly block ads from rendering in any admin view or admin URL
  if (typeof window !== 'undefined') {
    const path = window.location.pathname.toLowerCase();
    const search = window.location.search.toLowerCase();
    if (path.includes('admin') || search.includes('admin')) {
      return null;
    }
  }

  // Helper to construct self-contained iframe document for Adsterra banner scripts
  const createSrcDoc = (key: string, width: number, height: number) => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { box-sizing: border-box; }
        html, body {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      </style>
    </head>
    <body>
      <script type="text/javascript">
        atOptions = {
          'key' : '${key}',
          'format' : 'iframe',
          'height' : ${height},
          'width' : ${width},
          'params' : {}
        };
      </script>
      <script type="text/javascript" src="https://bauval.org/22/${key}"></script>
    </body>
    </html>
  `;

  if (type === 'responsive-header' || type === 'responsive-footer') {
    return (
      <div className={`w-full flex flex-col items-center justify-center my-4 ${className}`}>
        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1">
          Advertisement
        </span>
        {/* Desktop 728x90 */}
        <div className="hidden md:flex justify-center items-center w-[728px] h-[90px] bg-slate-100/80 rounded-xl overflow-hidden border border-slate-200/80 shadow-2xs">
          <iframe
            title={`ad-desktop-${id}`}
            srcDoc={createSrcDoc('8f3583472d8e8e263f5aaf92cabb27bf', 728, 90)}
            width="728"
            height="90"
            style={{ border: 'none', overflow: 'hidden' }}
            scrolling="no"
          />
        </div>
        {/* Mobile 320x50 */}
        <div className="flex md:hidden justify-center items-center w-[320px] h-[50px] bg-slate-100/80 rounded-lg overflow-hidden border border-slate-200/80 shadow-2xs">
          <iframe
            title={`ad-mobile-${id}`}
            srcDoc={createSrcDoc('7a83491e7e9540c7cc3ee6b43f92d6b2', 320, 50)}
            width="320"
            height="50"
            style={{ border: 'none', overflow: 'hidden' }}
            scrolling="no"
          />
        </div>
      </div>
    );
  }

  if (type === 'rectangle') {
    return (
      <div className={`flex flex-col items-center justify-center my-4 ${className}`}>
        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1">
          Sponsored
        </span>
        <div className="flex justify-center items-center w-[300px] h-[250px] bg-slate-100/80 rounded-2xl overflow-hidden border border-slate-200/80 shadow-2xs">
          <iframe
            title={`ad-rect-${id}`}
            srcDoc={createSrcDoc('fa03cd96a0775c7bca74128a2c362f90', 300, 250)}
            width="300"
            height="250"
            style={{ border: 'none', overflow: 'hidden' }}
            scrolling="no"
          />
        </div>
      </div>
    );
  }

  if (type === 'leaderboard') {
    return (
      <div className={`w-full flex flex-col items-center justify-center my-4 ${className}`}>
        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1">
          Advertisement
        </span>
        <div className="flex justify-center items-center w-[728px] max-w-full h-[90px] bg-slate-100/80 rounded-xl overflow-hidden border border-slate-200/80 shadow-2xs">
          <iframe
            title={`ad-lead-${id}`}
            srcDoc={createSrcDoc('8f3583472d8e8e263f5aaf92cabb27bf', 728, 90)}
            width="728"
            height="90"
            style={{ border: 'none', overflow: 'hidden' }}
            scrolling="no"
          />
        </div>
      </div>
    );
  }

  // mobile 320x50
  return (
    <div className={`flex flex-col items-center justify-center my-3 ${className}`}>
      <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1">
        Advertisement
      </span>
      <div className="flex justify-center items-center w-[320px] h-[50px] bg-slate-100/80 rounded-lg overflow-hidden border border-slate-200/80 shadow-2xs">
        <iframe
          title={`ad-mob-${id}`}
          srcDoc={createSrcDoc('7a83491e7e9540c7cc3ee6b43f92d6b2', 320, 50)}
          width="320"
          height="50"
          style={{ border: 'none', overflow: 'hidden' }}
          scrolling="no"
        />
      </div>
    </div>
  );
};
