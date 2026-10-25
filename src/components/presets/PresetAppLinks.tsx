'use client';

import { useEffect, useState } from 'react';
import { withCurrentAttribution } from '@/lib/analytics';
import { LANDING_HANDOFF_UPDATED } from '@/lib/landing-handoff';
import {
  buildNativeAppOpenUrl,
  buildPresetGooglePlayUrl,
  buildPresetMarketingUrl,
  buildPresetNativeAppUrl,
  mobileAppPlatform,
  presetSmartAppBanner,
} from '@/lib/app-links';
import { usePresetExperiment } from './PresetExperiment';
import { ButtonSpinner } from '@/components/ui/LoadingSpinner';
import { usePageAndroidInstallLink } from '@/components/layout/AndroidInstallLink';

export default function PresetAppLinks({ presetId, label, pagePath }: { presetId: string; label: string; pagePath: string }) {
  const context = usePresetExperiment();
  const [platform, setPlatform] = useState<'ios' | 'android' | null>(null);
  const [link, setLink] = useState<{ source: string; url: string }>();
  const appUrl = context?.appUrl;
  const locale = context?.locale;
  const resolved = context?.resolved;
  usePageAndroidInstallLink(
    pagePath,
    appUrl ? buildPresetGooglePlayUrl(appUrl) : undefined,
    !resolved || !!context?.pending,
    context?.trackClick,
  );

  useEffect(() => {
    setPlatform(mobileAppPlatform(navigator.userAgent, navigator.maxTouchPoints));
  }, []);

  useEffect(() => {
    if (!resolved || !appUrl || !locale) { setLink(undefined); return; }
    const meta = document.querySelector<HTMLMetaElement>('meta[name="apple-itunes-app"]');
    const previous = meta?.content;
    let content: string;
    const update = () => {
      setLink({ source: appUrl, url: withCurrentAttribution(buildPresetNativeAppUrl(appUrl, locale)) });
      if (meta) {
        content = presetSmartAppBanner(withCurrentAttribution(buildPresetMarketingUrl(appUrl, locale)));
        meta.content = content;
      }
    };
    update();
    window.addEventListener(LANDING_HANDOFF_UPDATED, update);
    window.addEventListener('consent-choice-changed', update);
    return () => {
      window.removeEventListener(LANDING_HANDOFF_UPDATED, update);
      window.removeEventListener('consent-choice-changed', update);
      if (meta && previous !== undefined && meta.content === content) meta.content = previous;
    };
  }, [appUrl, locale, resolved]);

  if (!platform) return null;
  const pending = !resolved || context?.pending || !link || link.source !== appUrl;
  return (
    <a
      href={pending || !link ? undefined : buildNativeAppOpenUrl(link.url, platform)}
      aria-disabled={pending || undefined}
      aria-busy={pending || undefined}
      className={`inline-flex min-h-14 w-full shrink-0 items-center justify-center gap-2 rounded-full border border-primary/40 bg-primary/5 px-6 py-3 text-center text-base font-semibold text-primary transition hover:border-primary hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary${pending ? ' cursor-wait opacity-60' : ''}`}
      onClick={(event) => {
        if (pending) { event.preventDefault(); return; }
        context?.trackClick();
        // Keep the navigation on the original tap; delayed redirects can lose app-opening permission.
        window.gtag?.('event', 'preset_app_open_click', { preset_id: presetId, client_platform: platform });
        console.info('Opening preset in native app', { platform, method: platform === 'android' ? 'intent' : 'app_link' });
      }}
    >
      {pending ? <ButtonSpinner variant="primary" className="shrink-0 border-current border-t-transparent motion-reduce:animate-none" /> : null}
      {label}
    </a>
  );
}
