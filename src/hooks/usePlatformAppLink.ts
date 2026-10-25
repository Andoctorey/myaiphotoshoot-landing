'use client';

import { useEffect, useState, type MouseEventHandler } from 'react';
import { trackEventAndNavigate, withCurrentAttribution } from '@/lib/analytics';
import { LANDING_HANDOFF_UPDATED } from '@/lib/landing-handoff';
import { APP_STORE_URL, GOOGLE_PLAY_URL, mobileAppPlatform, WEB_APP_IDEAS_URL } from '@/lib/app-links';
import { useAndroidInstallLink } from '@/components/layout/AndroidInstallLink';

type PlatformAppLink = {
  event: 'app_store_cta_click' | 'google_play_cta_click' | 'webapp_cta_click';
  url: string;
  pending?: boolean;
  trackClick?: () => void;
};

const WEB_APP_LINK: PlatformAppLink = {
  event: 'webapp_cta_click',
  url: WEB_APP_IDEAS_URL,
};

export function usePlatformAppLink(): PlatformAppLink & { onClick: MouseEventHandler<HTMLAnchorElement> } {
  const [platform, setPlatform] = useState<'ios' | 'android' | null>(null);
  const selection = useAndroidInstallLink();

  useEffect(() => {
    setPlatform(mobileAppPlatform(window.navigator.userAgent, window.navigator.maxTouchPoints));
  }, []);

  const link: PlatformAppLink = platform === 'ios'
    ? { event: 'app_store_cta_click', url: APP_STORE_URL }
    : platform === 'android'
      ? { event: 'google_play_cta_click', url: selection.url ?? GOOGLE_PLAY_URL, pending: selection.pending, trackClick: selection.trackClick }
      : WEB_APP_LINK;
  const url = useAttributedUrl(link.url);
  const onClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
    if (link.pending) { event.preventDefault(); return; }
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    link.trackClick?.();
    if (platform === 'android' || platform === 'ios') {
      // Keep the browser's new-tab navigation on the original tap; analytics must not delay it.
      window.gtag?.('event', link.event, { transport_type: 'beacon' });
      return;
    }
    event.preventDefault();
    trackEventAndNavigate(link.event, url);
  };
  return { ...link, url, onClick };
}

export function useAttributedUrl(url: string): string {
  const [attributedUrl, setAttributedUrl] = useState({ source: url, value: url });

  useEffect(() => {
    const update = () => setAttributedUrl({ source: url, value: withCurrentAttribution(url) });
    update();
    window.addEventListener(LANDING_HANDOFF_UPDATED, update);
    window.addEventListener('consent-choice-changed', update);
    return () => {
      window.removeEventListener(LANDING_HANDOFF_UPDATED, update);
      window.removeEventListener('consent-choice-changed', update);
    };
  }, [url]);

  return attributedUrl.source === url ? attributedUrl.value : url;
}
