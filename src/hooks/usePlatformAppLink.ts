'use client';

import { useEffect, useState } from 'react';
import { withCurrentAttribution } from '@/lib/analytics';
import { LANDING_HANDOFF_UPDATED } from '@/lib/landing-handoff';
import { APP_STORE_URL, GOOGLE_PLAY_URL, mobileAppPlatform, WEB_APP_IDEAS_URL } from '@/lib/app-links';

type PlatformAppLink = {
  event: 'app_store_cta_click' | 'google_play_cta_click' | 'webapp_cta_click';
  url: string;
};

const WEB_APP_LINK: PlatformAppLink = {
  event: 'webapp_cta_click',
  url: WEB_APP_IDEAS_URL,
};

export function usePlatformAppLink(): PlatformAppLink {
  const [appLink, setAppLink] = useState<PlatformAppLink>(WEB_APP_LINK);

  useEffect(() => {
    const platform = mobileAppPlatform(window.navigator.userAgent, window.navigator.maxTouchPoints);
    const link: PlatformAppLink = platform === 'ios'
      ? { event: 'app_store_cta_click', url: APP_STORE_URL }
      : platform === 'android'
        ? { event: 'google_play_cta_click', url: GOOGLE_PLAY_URL }
        : WEB_APP_LINK;
    const update = () => setAppLink({ ...link, url: withCurrentAttribution(link.url) });
    update();
    window.addEventListener(LANDING_HANDOFF_UPDATED, update);
    window.addEventListener('consent-choice-changed', update);
    return () => {
      window.removeEventListener(LANDING_HANDOFF_UPDATED, update);
      window.removeEventListener('consent-choice-changed', update);
    };
  }, []);

  return appLink;
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
