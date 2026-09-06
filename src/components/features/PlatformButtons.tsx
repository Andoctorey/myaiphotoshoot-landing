'use client';

import Image from 'next/image';
import { trackEventAndNavigate } from '@/lib/analytics';
import { APP_STORE_URL, GOOGLE_PLAY_URL, WEB_APP_IDEAS_URL } from '@/lib/app-links';
import { useAttributedUrl } from '@/hooks/usePlatformAppLink';

type Props = {
  webAppLabel: string;
  webAppEyebrow: string;
  webAppTitle: string;
  googlePlayLabel: string;
  appStoreLabel: string;
  webAppUrl?: string;
  analyticsParams?: Record<string, unknown>;
  className?: string;
};

export default function PlatformButtons({
  webAppLabel,
  webAppEyebrow,
  webAppTitle,
  googlePlayLabel,
  appStoreLabel,
  webAppUrl = WEB_APP_IDEAS_URL,
  analyticsParams,
  className = '',
}: Props) {
  const attributedWebAppUrl = useAttributedUrl(webAppUrl);
  const playStoreUrl = useAttributedUrl(GOOGLE_PLAY_URL);
  const appStoreUrl = useAttributedUrl(APP_STORE_URL);

  return (
    <div className={`flex w-full flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap ${className}`}>
      <a
        href={attributedWebAppUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={webAppLabel}
        className="inline-flex h-12 w-[166px] shrink-0 items-center rounded-lg border border-[#a6a6a6] bg-black px-3 text-white transition duration-150 hover:-translate-y-0.5 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
          e.preventDefault();
          trackEventAndNavigate('webapp_cta_click', attributedWebAppUrl, analyticsParams);
        }}
      >
        <svg className="h-8 w-8 shrink-0 ltr:mr-2.5 rtl:ml-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="10" strokeWidth={1.8} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2 12h20M12 2c2.5 2.73 3.9 6.23 3.9 10S14.5 19.27 12 22M12 2C9.5 4.73 8.1 8.23 8.1 12s1.4 7.27 3.9 10" />
        </svg>
        <span className="flex min-w-0 flex-1 flex-col items-start text-start leading-none">
          <span className="whitespace-nowrap text-[clamp(8px,2.4vw,10px)] font-normal leading-none">{webAppEyebrow}</span>
          <span className="mt-1 whitespace-nowrap text-[clamp(14px,4.5vw,18px)] font-medium leading-none tracking-[-0.025em]">{webAppTitle}</span>
        </span>
      </a>

      <a
        href={playStoreUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-12 w-[180px] items-center justify-center rounded-lg transition duration-150 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
          e.preventDefault();
          trackEventAndNavigate('google_play_cta_click', playStoreUrl, analyticsParams);
        }}
      >
        <Image
          alt={googlePlayLabel}
          src="/images/google-play-badge.svg"
          width={202}
          height={56}
          className="h-12 w-full object-contain"
        />
      </a>

      <a
        href={appStoreUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-12 w-[180px] items-center justify-center rounded-lg transition duration-150 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
          e.preventDefault();
          trackEventAndNavigate('app_store_cta_click', appStoreUrl, analyticsParams);
        }}
      >
        <Image
          alt={appStoreLabel}
          src="/images/app-store-badge.svg"
          width={202}
          height={56}
          className="h-12 w-full object-contain"
        />
      </a>
    </div>
  );
}
