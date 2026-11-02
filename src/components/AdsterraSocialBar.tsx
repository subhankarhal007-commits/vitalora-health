import React, { useEffect } from 'react';

interface AdsterraSocialBarProps {
  disabled?: boolean;
}

export const AdsterraSocialBar: React.FC<AdsterraSocialBarProps> = ({ disabled = false }) => {
  useEffect(() => {
    // Strictly prevent loading anywhere in admin views or when admin is logged in
    if (disabled) return;

    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (path.includes('admin') || search.includes('admin')) {
        return;
      }
    }

    const scriptId = 'adsterra-social-bar-script';
    // If already inserted, skip
    if (document.getElementById(scriptId)) return;

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://bauval.org/14/19344331560d80307e6b9822e3b577af';
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    document.body.appendChild(script);

    return () => {
      // Remove script if component unmounts or switches to admin
      const el = document.getElementById(scriptId);
      if (el) el.remove();
    };
  }, [disabled]);

  return null;
};
