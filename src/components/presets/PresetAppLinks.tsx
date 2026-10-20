'use client';

import { useEffect, useState } from 'react';
import { withCurrentAttribution } from '@/lib/analytics';
import { buildPresetMarketingUrl, buildPresetNativeAppUrl, mobileAppPlatform, presetSmartAppBanner } from '@/lib/app-links';
import { usePresetExperiment } from './PresetExperiment';

export default function PresetAppLinks({ presetId, label }: { presetId: string; label: string }) {
  const context = usePresetExperiment();
  const [platform, setPlatform] = useState<'ios' | 'android' | null>(null);
  const [link, setLink] = useState<{ source: string; url: string }>();
  const appUrl = context?.appUrl;
  const locale = context?.locale;
  const resolved = context?.resolved;

  useEffect(() => {
    setPlatform(mobileAppPlatform(navigator.userAgent, navigator.maxTouchPoints));
  }, []);

  useEffect(() => {
    if (!resolved || !appUrl || !locale) { setLink(undefined); return; }
    setLink({ source: appUrl, url: withCurrentAttribution(buildPresetNativeAppUrl(appUrl, locale)) });
    const meta = document.querySelector<HTMLMetaElement>('meta[name="apple-itunes-app"]');
    if (!meta) return;
    const previous = meta.content;
    const content = presetSmartAppBanner(withCurrentAttribution(buildPresetMarketingUrl(appUrl, locale)));
    meta.content = content;
    return () => { if (meta.content === content) meta.content = previous; };
  }, [appUrl, locale, resolved]);

  if (!platform) return null;
  const pending = !resolved || context?.pending || !link || link.source !== appUrl;
  return (
    <a
      href={pending ? undefined : link?.url}
      aria-disabled={pending || undefined}
      aria-busy={pending || undefined}
      className={`inline-flex min-h-11 items-center justify-center rounded-full px-5 py-2 text-sm font-semibold text-gray-700 underline decoration-gray-400 underline-offset-4 hover:text-primary dark:text-gray-200${pending ? ' cursor-wait opacity-60' : ''}`}
      onClick={(event) => {
        if (pending) { event.preventDefault(); return; }
        context?.trackClick();
        // Keep the navigation on the original tap; delayed redirects can lose app-opening permission.
        window.gtag?.('event', 'preset_app_open_click', { preset_id: presetId, client_platform: platform });
        console.info('Opening preset in native app', { platform });
      }}
    >{label}</a>
  );
}
