'use client';

import Image from 'next/image';
import { trackEventAndNavigate } from '@/lib/analytics';
import { useTranslations } from '@/lib/utils';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.myaiphotoshoot&utm_source=landing&pcampaignid=pcampaignidMKT-Other-global-all-co-prtnr-py-PartBadge-Mar2515-1';

export default function PlatformButtons() {
  const t = useTranslations('download');

  return (
    <div className="flex w-full flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
      <a
        href="https://app.myaiphotoshoot.com"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-12 w-[202px] items-center justify-center rounded-lg bg-gray-950 px-5 text-base font-semibold text-white shadow-md transition duration-150 hover:-translate-y-0.5 hover:bg-purple-700 dark:bg-black dark:hover:bg-purple-700"
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
          e.preventDefault();
          trackEventAndNavigate('webapp_cta_click', 'https://app.myaiphotoshoot.com');
        }}
      >
        <svg className="h-5 w-5 ltr:mr-2 rtl:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
        {t('webApp.button')}
      </a>

      <a
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="transition duration-150 hover:-translate-y-0.5"
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
          e.preventDefault();
          trackEventAndNavigate('google_play_cta_click', PLAY_STORE_URL);
        }}
      >
        <Image
          alt={t('mobileApps.googlePlay')}
          src="/images/google-play-badge.svg"
          width={202}
          height={56}
          className="h-12 w-auto object-contain"
        />
      </a>

      <a
        href="https://apps.apple.com/app/id6744860178"
        target="_blank"
        rel="noopener noreferrer"
        className="transition duration-150 hover:-translate-y-0.5"
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
          e.preventDefault();
          trackEventAndNavigate('app_store_cta_click', 'https://apps.apple.com/app/id6744860178');
        }}
      >
        <Image
          alt={t('mobileApps.appStore')}
          src="/images/app-store-badge.svg"
          width={202}
          height={56}
          className="h-12 w-auto object-contain"
        />
      </a>
    </div>
  );
}
