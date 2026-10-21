'use client';

import { Suspense, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { captureCurrentAttribution } from '@/lib/analytics';
import { prepareLandingHandoff } from '@/lib/landing-handoff';

const CONSENT_REGION = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'EL', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'IS', 'LI', 'NO', 'GB'];

interface GoogleAnalyticsProps {
  measurementId: string;
}

export default function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  useEffect(() => {
    captureCurrentAttribution();
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      // Google tag requires the native arguments object rather than a rest-parameter array.
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments);
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
    window.gtag('event', 'landing_view', {
      page_path: `${window.location.pathname}${window.location.search}`,
    });

    if (!document.getElementById('google-analytics-script')) {
      const script = document.createElement('script');
      script.id = 'google-analytics-script';
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      document.head.appendChild(script);
    }
    const prepareHandoff = () => { void prepareLandingHandoff(measurementId); };
    const analyticsScript = document.getElementById('google-analytics-script');
    analyticsScript?.addEventListener('load', prepareHandoff);
    prepareHandoff();
    window.addEventListener('consent-choice-changed', prepareHandoff);
    return () => {
      analyticsScript?.removeEventListener('load', prepareHandoff);
      window.removeEventListener('consent-choice-changed', prepareHandoff);
    };
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

    captureCurrentAttribution();
    if (!window.gtag) return;

    const search = searchParams.toString();
    const pagePath = `${pathname}${search ? `?${search}` : ''}`;
    window.gtag('event', 'landing_view', { page_path: pagePath });
    window.gtag('config', measurementId, {
      page_title: document.title,
      page_path: pagePath,
      page_location: window.location.href,
    });
    void prepareLandingHandoff(measurementId);
  }, [measurementId, pathname, searchParams]);

  return null;
}
