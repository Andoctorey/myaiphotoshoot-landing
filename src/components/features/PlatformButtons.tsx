'use client';

import Image from 'next/image';
import { trackEventAndNavigate } from '@/lib/analytics';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.myaiphotoshoot&utm_source=landing&pcampaignid=pcampaignidMKT-Other-global-all-co-prtnr-py-PartBadge-Mar2515-1';

type Props = {
  webAppLabel: string;
  googlePlayLabel: string;
  appStoreLabel: string;
};

export default function PlatformButtons({ webAppLabel, googlePlayLabel, appStoreLabel }: Props) {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
      <a
        href="https://app.myaiphotoshoot.com"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-12 w-[166px] items-center justify-center rounded-lg bg-gray-950 px-4 text-sm font-semibold text-white shadow-md transition duration-150 hover:-translate-y-0.5 hover:bg-purple-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 dark:bg-black dark:hover:bg-purple-700 dark:focus-visible:ring-offset-gray-900"
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
          e.preventDefault();
          trackEventAndNavigate('webapp_cta_click', 'https://app.myaiphotoshoot.com');
        }}
      >
        <svg className="h-5 w-5 ltr:mr-2 rtl:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" strokeWidth={2} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18M12 3c2.25 2.46 3.5 5.61 3.5 9S14.25 18.54 12 21M12 3C9.75 5.46 8.5 8.61 8.5 12s1.25 6.54 3.5 9" />
        </svg>
        {webAppLabel}
      </a>

      <a
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-12 w-[180px] items-center justify-center rounded-lg transition duration-150 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
          e.preventDefault();
          trackEventAndNavigate('google_play_cta_click', PLAY_STORE_URL);
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
        href="https://apps.apple.com/app/id6744860178"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-12 w-[180px] items-center justify-center rounded-lg transition duration-150 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
          e.preventDefault();
          trackEventAndNavigate('app_store_cta_click', 'https://apps.apple.com/app/id6744860178');
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
