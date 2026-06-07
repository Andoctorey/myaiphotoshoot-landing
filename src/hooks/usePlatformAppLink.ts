'use client';

import { useEffect, useState } from 'react';

const APP_STORE_URL = 'https://apps.apple.com/app/id6744860178';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.myaiphotoshoot&utm_source=landing&pcampaignid=pcampaignidMKT-Other-global-all-co-prtnr-py-PartBadge-Mar2515-1';
const WEB_APP_URL = 'https://app.myaiphotoshoot.com';

type PlatformAppLink = {
  event: 'app_store_cta_click' | 'google_play_cta_click' | 'webapp_cta_click';
  url: string;
};

const WEB_APP_LINK: PlatformAppLink = {
  event: 'webapp_cta_click',
  url: WEB_APP_URL,
};

export function usePlatformAppLink(): PlatformAppLink {
  const [appLink, setAppLink] = useState<PlatformAppLink>(WEB_APP_LINK);

  useEffect(() => {
    const userAgent = window.navigator.userAgent;
    const isIOS = /iphone|ipad|ipod/i.test(userAgent)
      || (/macintosh/i.test(userAgent) && window.navigator.maxTouchPoints > 1);

    if (isIOS) {
      setAppLink({ event: 'app_store_cta_click', url: APP_STORE_URL });
    } else if (/android/i.test(userAgent)) {
      setAppLink({ event: 'google_play_cta_click', url: PLAY_STORE_URL });
    }
  }, []);

  return appLink;
}
