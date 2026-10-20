'use client';

import { useEffect, useState } from 'react';
import { useAttributedUrl } from '@/hooks/usePlatformAppLink';
import { buildMaskNativeAppUrl, mobileAppPlatform, type MaskLinkGender } from '@/lib/app-links';

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
      href={href}
      aria-label={maskName ? `${label}: ${maskName}` : undefined}
      className="inline-flex min-h-11 items-center justify-center rounded-full px-5 py-2 text-center text-sm font-semibold text-gray-700 underline decoration-gray-400 underline-offset-4 hover:text-primary dark:text-gray-200"
      onClick={() => {
        window.gtag?.('event', 'mask_app_open_click', { mask_id: maskId ?? 'all', client_platform: platform });
        console.info('Opening Masks in native app', { platform });
      }}
    >{label}</a>
  );
}
