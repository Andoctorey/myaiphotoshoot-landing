import { LANDING_HANDOFF_PARAMETER, readLandingHandoff } from './landing-handoff';

// Google Analytics configuration
export const GA_MEASUREMENT_ID = 'G-0T00P896RF';
export const TIKTOK_PIXEL_ID = 'D8FEKE3C77U4A83CCF00';

const ATTRIBUTION_PARAMETERS = [
  'gclid',
  'gbraid',
  'wbraid',
  'dclid',
  'utm_id',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
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
  const stored = readStoredAttribution();
  const storedCampaign = new URLSearchParams();
  copyAttributionParameters(stored, storedCampaign);
  if (stored.has('landing_path') && (!serializedAttribution || serializedAttribution === storedCampaign.toString())) return;
  attribution.set('landing_path', window.location.pathname || '/');

  try {
    window.sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, attribution.toString());
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
    const firstParty = url.protocol === 'https:' &&
      ['myaiphotoshoot.com', 'www.myaiphotoshoot.com', 'app.myaiphotoshoot.com'].includes(url.hostname);
    const handoff = readLandingHandoff();
    const landingPath = attribution.get('landing_path');
    if (firstParty) {
      if (handoff) url.searchParams.set(LANDING_HANDOFF_PARAMETER, handoff);
      else url.searchParams.delete(LANDING_HANDOFF_PARAMETER);
      if (landingPath) url.searchParams.set('landing_path', landingPath.slice(0, 200));
    } else {
      url.searchParams.delete(LANDING_HANDOFF_PARAMETER);
      url.searchParams.delete('landing_path');
    }
    if (url.hostname === 'play.google.com') {
      url.searchParams.delete('referrer');
      const installReferrer = new URLSearchParams();
      // Keep click IDs when long optional campaign tags would otherwise discard the whole referrer.
      const addReferrer = (name: string, value: string | null) => {
        if (!value) return;
        installReferrer.set(name, value);
        if (installReferrer.toString().length > 512) installReferrer.delete(name);
      };
      ATTRIBUTION_PARAMETERS.slice(0, 4).forEach(name => addReferrer(name, url.searchParams.get(name)));
      if (url.protocol === 'https:' && url.searchParams.get('id') === 'com.myaiphotoshoot') {
        addReferrer(LANDING_HANDOFF_PARAMETER, handoff);
      }
      ATTRIBUTION_PARAMETERS.slice(4).forEach(name => addReferrer(name, url.searchParams.get(name)));
      addReferrer('landing_path', landingPath);
      const serializedReferrer = installReferrer.toString();
      if (serializedReferrer) {
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
    __enableTikTokPixel?: (loadImmediately?: boolean) => void;
    __grantTikTokConsent?: (loadImmediately?: boolean) => void;
    __revokeTikTokConsent?: () => void;
    __queueTikTokPageView?: () => void;
    __tiktokPixelLoaded?: boolean;
    __tiktokTrackingEnabled?: boolean;
  }
} 
