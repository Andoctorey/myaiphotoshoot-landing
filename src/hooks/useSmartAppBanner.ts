'use client';

import { useEffect } from 'react';
import { withCurrentAttribution } from '@/lib/analytics';
import { smartAppBanner } from '@/lib/app-links';
import { LANDING_HANDOFF_UPDATED } from '@/lib/landing-handoff';

export function useSmartAppBanner(url: string | undefined) {
  useEffect(() => {
    if (!url) return;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="apple-itunes-app"]');
    if (!meta) return;
    const previous = meta.content;
    let content: string;
    const update = () => {
      content = smartAppBanner(withCurrentAttribution(url));
      meta.content = content;
    };
    update();
    window.addEventListener(LANDING_HANDOFF_UPDATED, update);
    window.addEventListener('consent-choice-changed', update);
    return () => {
      window.removeEventListener(LANDING_HANDOFF_UPDATED, update);
      window.removeEventListener('consent-choice-changed', update);
      // A newer route may already own the shared metadata element.
      if (meta.content === content) meta.content = previous;
    };
  }, [url]);
}
