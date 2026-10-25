'use client';

import { useEffect, useState } from 'react';
import { useAttributedUrl } from '@/hooks/usePlatformAppLink';
import { buildMaskNativeAppUrl, buildNativeAppOpenUrl, mobileAppPlatform, type MaskLinkGender } from '@/lib/app-links';

type Props = {
  label: string;
  locale: string;
  maskId?: string;
  maskName?: string;
  gender?: MaskLinkGender;
  hiddenOnIos?: boolean;
};

export default function MaskAppLink({ label, locale, maskId, maskName, gender, hiddenOnIos = false }: Props) {
  const [platform, setPlatform] = useState<'ios' | 'android' | null>(null);
  const href = useAttributedUrl(buildMaskNativeAppUrl(maskId, locale, gender));

  useEffect(() => {
    setPlatform(mobileAppPlatform(navigator.userAgent, navigator.maxTouchPoints));
  }, []);

  if (!platform || (platform === 'ios' && hiddenOnIos)) return null;

  return (
    <a
      href={buildNativeAppOpenUrl(href, platform)}
      aria-label={maskName ? `${label}: ${maskName}` : undefined}
      className="inline-flex min-h-14 w-full max-w-[420px] shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/5 px-6 py-3 text-center text-base font-semibold text-primary transition hover:border-primary hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
      onClick={() => {
        window.gtag?.('event', 'mask_app_open_click', { mask_id: maskId ?? 'all', client_platform: platform });
        console.info('Opening Masks in native app', { platform, method: platform === 'android' ? 'intent' : 'app_link' });
      }}
    >{label}</a>
  );
}
