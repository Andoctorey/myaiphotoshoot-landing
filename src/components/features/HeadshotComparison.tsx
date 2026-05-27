'use client';

import Link from 'next/link';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { localePath } from '@/lib/seo';
import { useLocale, useTranslations } from '@/lib/utils';

const cards = ['pricing', 'likeness', 'control'] as const;

export default function HeadshotComparison() {
  const locale = useLocale();
  const t = useTranslations('headshotComparison');

  return (
    <section className="py-16 bg-white dark:bg-gray-900" aria-labelledby="headshot-comparison-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-400">
              {t('eyebrow')}
            </p>
            <h2 id="headshot-comparison-title" className="mt-2 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              {t('title')}
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              {t('description')}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href={localePath(locale, '/use-cases/ai-headshot-generator-for-linkedin-resumes-and-team-pages/')}
                className="inline-flex items-center justify-center rounded-lg bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-700"
              >
                {t('primaryLink')}
              </Link>
              <Link
                href={localePath(locale, '/use-cases/ai-profile-picture-generator-realistic-headshots-avatars/')}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-900 transition hover:border-purple-300 hover:text-purple-700 dark:border-gray-700 dark:text-white dark:hover:border-purple-500 dark:hover:text-purple-300"
              >
                {t('secondaryLink')}
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {cards.map((card) => (
              <div key={card} className="rounded-lg border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-950">
                <CheckCircleIcon className="h-7 w-7 text-green-500" aria-hidden="true" />
                <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
                  {t(`cards.${card}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                  {t(`cards.${card}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
