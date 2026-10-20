'use client';

import { useEffect, useState } from 'react';
import { withCurrentAttribution } from '@/lib/analytics';
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

    if (platform === 'ios') {
      setAppLink({
        event: 'app_store_cta_click',
        url: withCurrentAttribution(APP_STORE_URL),
      });
    } else if (platform === 'android') {
      setAppLink({
        event: 'google_play_cta_click',
        url: withCurrentAttribution(GOOGLE_PLAY_URL),
      });
    } else {
      setAppLink({
        ...WEB_APP_LINK,
        url: withCurrentAttribution(WEB_APP_LINK.url),
      });
    }
  }, []);

  return appLink;
}

export function useAttributedUrl(url: string): string {
  const [attributedUrl, setAttributedUrl] = useState(url);

  useEffect(() => {
    setAttributedUrl(withCurrentAttribution(url));
  }, [url]);

  return attributedUrl;
}
