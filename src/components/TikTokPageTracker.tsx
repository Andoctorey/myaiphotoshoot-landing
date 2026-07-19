'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function TikTokPageTracker() {
  const pathname = usePathname();
  const hasTrackedInitialPage = useRef(false);

  useEffect(() => {
    if (!hasTrackedInitialPage.current) {
      hasTrackedInitialPage.current = true;
      return;
    }

    if (window.__tiktokTrackingEnabled) {
      window.ttq?.page();
    }
  }, [pathname]);

  return null;
}
