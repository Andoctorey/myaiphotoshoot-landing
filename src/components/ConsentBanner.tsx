'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

export default function ConsentBanner() {
  const [show, setShow] = useState(false);
  const [isEEA, setIsEEA] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('consent_choice');
    if (stored) return;

    // Try to detect region using Intl and a lightweight fetch to a country endpoint as fallback
    const region = (Intl as any)?.DateTimeFormat?.().resolvedOptions?.().timeZone || '';
    // Basic heuristic: we will fetch server country endpoint; if it fails, default to show
    fetch('/api/geo/country').then(async (res) => {
      if (!res.ok) throw new Error('geo failed');
      const data = await res.json();
      const eeaCountries = new Set(['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','EL','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','IS','LI','NO','GB']);
      const inEEA = eeaCountries.has(String(data.country || '').toUpperCase());
      setIsEEA(inEEA);
      setShow(inEEA);
    }).catch(() => {
      // If detection fails, do not block UX; do not show by default
      setIsEEA(false);
      setShow(false);
    });
  }, []);

  const acceptAll = () => {
    try { localStorage.setItem('consent_choice', 'accepted'); } catch {}
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
      });
    }
    setShow(false);
  };

  const rejectAll = () => {
    try { localStorage.setItem('consent_choice', 'rejected'); } catch {}
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      });
    }
    setShow(false);
  };

  if (!show || !isEEA) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-6">
        <div className="rounded-xl bg-white/95 dark:bg-gray-900/95 backdrop-blur shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              We use cookies to improve your experience, measure performance, and for marketing. You can accept or reject optional cookies.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={rejectAll}
              >
                Reject optional
              </button>
              <button
                className="px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700"
                onClick={acceptAll}
              >
                Accept all
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


