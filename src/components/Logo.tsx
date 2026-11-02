import React from 'react';

interface LogoProps {
  className?: string;
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  showTagline = true,
  size = 'md',
  onClick,
}) => {
  const iconSize = size === 'sm' ? 32 : size === 'lg' ? 48 : 40;
  const textSize = size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-3xl' : 'text-2xl';
  const taglineSize = size === 'sm' ? 'text-[10px]' : size === 'lg' ? 'text-xs' : 'text-[11px]';

  return (
    <div
      onClick={onClick}
      className={`group flex items-center gap-3 cursor-pointer select-none transition-all duration-200 ${className}`}
    >
      {/* Organic Emerald Leaf & Vitality Ring Emblem */}
      <div className="relative flex items-center justify-center">
        <div
          style={{ width: iconSize, height: iconSize }}
          className="relative rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 shadow-md shadow-emerald-700/20 flex items-center justify-center p-1.5 transition-transform duration-300 group-hover:scale-105"
        >
          {/* Subtle inner highlight */}
          <div className="absolute inset-0 rounded-2xl bg-white/15 backdrop-blur-[0.5px]" />
          
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-full h-full relative z-10 text-white drop-shadow-sm"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Elegant stylized health leaf with center vein & morning dew */}
            <path
              d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"
              fill="rgba(255,255,255,0.18)"
            />
            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            <circle cx="16" cy="8" r="1" fill="currentColor" stroke="none" />
          </svg>
        </div>

        {/* Ambient subtle glow pulse */}
        <span className="absolute -inset-0.5 rounded-2xl bg-emerald-400 opacity-20 blur-sm group-hover:opacity-40 transition-opacity" />
      </div>

      {/* Brand Identity */}
      <div className="flex flex-col">
        <div className="flex items-baseline">
          <span className={`font-serif font-bold tracking-tight text-slate-900 group-hover:text-emerald-950 transition-colors ${textSize}`}>
            Vitalora
          </span>
          <span className={`font-serif font-semibold text-emerald-600 ml-1.5 ${textSize}`}>
            Health
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1 inline-block self-center" />
        </div>

        {showTagline && (
          <span className={`font-medium tracking-wide uppercase text-emerald-700/80 font-sans ${taglineSize}`}>
            Your Daily Guide to Better Health
          </span>
        )}
      </div>
    </div>
  );
};
