// Google Analytics configuration
export const GA_MEASUREMENT_ID = 'G-0T00P896RF';
export const TIKTOK_PIXEL_ID = 'D8FEKE3C77U4A83CCF00';

const ATTRIBUTION_PARAMETERS = [
  'utm_id',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'dclid',
  'gbraid',
  'wbraid',
  'ttclid',
  'fbclid',
  'msclkid',
] as const;
const ATTRIBUTION_STORAGE_KEY = 'landing_attribution';

const readStoredAttribution = (): URLSearchParams => {
  try {
    return new URLSearchParams(window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY) || '');
  } catch {
    return new URLSearchParams();
  }
};

const copyAttributionParameters = (
  source: URLSearchParams,
  destination: URLSearchParams,
): void => {
  ATTRIBUTION_PARAMETERS.forEach((parameter) => {
    const value = source.get(parameter);
    if (value) destination.set(parameter, value);
  });
};

export const captureCurrentAttribution = (): void => {
  if (typeof window === 'undefined') return;

  const current = new URLSearchParams(window.location.search);
  const attribution = new URLSearchParams();
  copyAttributionParameters(current, attribution);
  const serializedAttribution = attribution.toString();
  if (!serializedAttribution) return;

  try {
    window.sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, serializedAttribution);
  } catch {}
};

export const withCurrentAttribution = (destination: string): string => {
  if (typeof window === 'undefined') return destination;

  try {
    captureCurrentAttribution();
    const url = new URL(destination, window.location.origin);
    const current = new URLSearchParams(window.location.search);
    const attribution = readStoredAttribution();
    copyAttributionParameters(current, attribution);
    copyAttributionParameters(attribution, url.searchParams);
    if (url.hostname === 'play.google.com') {
      url.searchParams.delete('referrer');
      const installReferrer = new URLSearchParams();
      copyAttributionParameters(url.searchParams, installReferrer);
      const serializedReferrer = installReferrer.toString();
      if (serializedReferrer && serializedReferrer.length <= 512) {
        url.searchParams.set('referrer', serializedReferrer);
      }
    }
    return url.toString();
  } catch {
    return destination;
  }
};

// Utility function to track page views
export const trackPageView = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_location: url,
    });
  }
};

// Utility function to track events
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Fire an event and navigate after GA acknowledges (or after a short timeout)
export const trackEventAndNavigate = (
  action: string,
  url: string,
  params?: Record<string, unknown>
) => {
  if (typeof window === 'undefined') return;
  const attributedUrl = withCurrentAttribution(url);
  const navigate = () => {
    window.location.href = attributedUrl;
  };
  if (!window.gtag) {
    navigate();
    return;
  }
  let didNavigate = false;
  const safeNavigate = () => {
    if (!didNavigate) {
      didNavigate = true;
      navigate();
    }
  };
  window.gtag('event', action, {
    ...(params || {}),
    transport_type: 'beacon',
    event_callback: safeNavigate,
    event_timeout: 200,
  } as unknown as Record<string, unknown>);
  // Fallback in case callback doesn't fire quickly
  setTimeout(safeNavigate, 400);
};

// Types for gtag
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
    ttq?: {
      page: () => void;
      track: (event: string, params?: Record<string, unknown>) => void;
      grantConsent: () => void;
      revokeConsent: () => void;
    };
    __enableTikTokPixel?: () => void;
    __grantTikTokConsent?: () => void;
    __revokeTikTokConsent?: () => void;
    __tiktokPixelLoaded?: boolean;
    __tiktokTrackingEnabled?: boolean;
  }
} 
