'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import Image from 'next/image';
import { useTranslations } from '@/lib/utils';
import { trackEventAndNavigate } from '@/lib/analytics';

export default function Download() {
  const t = useTranslations('download');
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section id="download" className="relative overflow-hidden bg-gradient-to-b from-white via-purple-50/40 to-gray-50 py-14 dark:from-gray-900 dark:via-purple-950/20 dark:to-gray-800 md:py-16">
      <div aria-hidden="true" className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-200/30 blur-3xl dark:bg-purple-800/15" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-purple-600 dark:bg-purple-400" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            {t('choosePlatform')}
          </h2>
        </motion.div>

        {/* Download Options */}
        <motion.div
          id="download-options"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mx-auto flex max-w-4xl flex-col items-center"
        >
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
              href='https://play.google.com/store/apps/details?id=com.myaiphotoshoot&utm_source=landing&pcampaignid=pcampaignidMKT-Other-global-all-co-prtnr-py-PartBadge-Mar2515-1'
              target="_blank"
              rel="noopener noreferrer"
              className="transition duration-150 hover:-translate-y-0.5"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                e.preventDefault();
                trackEventAndNavigate('google_play_cta_click', 'https://play.google.com/store/apps/details?id=com.myaiphotoshoot&utm_source=landing&pcampaignid=pcampaignidMKT-Other-global-all-co-prtnr-py-PartBadge-Mar2515-1');
              }}
            >
              <Image
                alt={t('mobileApps.googlePlay')}
                src='/images/google-play-badge.svg'
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
                src='/images/app-store-badge.svg'
                width={202}
                height={56}
                className="h-12 w-auto object-contain"
              />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
