// Google Analytics configuration
export const GA_MEASUREMENT_ID = 'G-KRJDJFVKG4';

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
  const navigate = () => {
    window.location.href = url;
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
  }
} 