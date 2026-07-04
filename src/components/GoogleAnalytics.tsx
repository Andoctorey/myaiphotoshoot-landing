'use client';

import { Suspense, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const CONSENT_REGION = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'EL', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'IS', 'LI', 'NO', 'GB'];

interface GoogleAnalyticsProps {
  measurementId: string;
}

export default function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  useEffect(() => {
    window.dataLayer = window.dataLayer || [];
    window.gtag = (...args: unknown[]) => {
      window.dataLayer.push(args);
    };
    window.gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      wait_for_update: 500,
      region: CONSENT_REGION,
    });

    try {
      const storedConsent = window.localStorage.getItem('consent_choice');
      if (storedConsent === 'accepted' || storedConsent === 'rejected') {
        const consentValue = storedConsent === 'accepted' ? 'granted' : 'denied';
        window.gtag('consent', 'update', {
          analytics_storage: consentValue,
          ad_storage: consentValue,
          ad_user_data: consentValue,
          ad_personalization: consentValue,
        });
      }
    } catch {}

    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      page_title: document.title,
      page_location: window.location.href,
    });

    if (!document.getElementById('google-analytics-script')) {
      const script = document.createElement('script');
      script.id = 'google-analytics-script';
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      document.head.appendChild(script);
    }
  }, [measurementId]);

  return (
    <Suspense fallback={null}>
      <GoogleAnalyticsPageViewTracker measurementId={measurementId} />
    </Suspense>
  );
}

function GoogleAnalyticsPageViewTracker({ measurementId }: GoogleAnalyticsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialPageViewTracked = useRef(false);

  useEffect(() => {
    if (!initialPageViewTracked.current) {
      initialPageViewTracked.current = true;
      return;
    }

    if (!window.gtag) return;

    const search = searchParams.toString();
    window.gtag('config', measurementId, {
      page_title: document.title,
      page_path: `${pathname}${search ? `?${search}` : ''}`,
      page_location: window.location.href,
    });
  }, [measurementId, pathname, searchParams]);

  return null;
}
