import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import PlatformButtons from './PlatformButtons';

export default async function Hero({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'hero' });
  const tDownload = await getTranslations({ locale, namespace: 'download' });

  return (
    <section className="bg-gradient-to-b from-purple-50 to-white pb-8 pt-10 dark:from-purple-950 dark:to-gray-900 sm:pt-14 md:pb-10 md:pt-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)] lg:gap-12">
          <div className="text-center lg:text-start">
            <h1 className="mb-6 text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
              {t('title')}
              <span className="text-purple-600 dark:text-purple-400"> {t('titleHighlight')}</span>
            </h1>
            <p className="mx-auto mb-4 max-w-3xl text-xl text-gray-600 dark:text-gray-300 md:text-2xl lg:mx-0">
              {t('description')}
            </p>
            <p className="mx-auto max-w-4xl text-sm text-gray-500 dark:text-gray-400 md:text-base lg:mx-0">
              {t('microcopy')}
            </p>
            <div className="mx-auto mt-6 max-w-3xl lg:mx-0">
              <PlatformButtons
                webAppLabel={tDownload('webApp.button')}
                googlePlayLabel={tDownload('mobileApps.googlePlay')}
                appStoreLabel={tDownload('mobileApps.appStore')}
                className="lg:justify-start"
              />
            </div>
          </div>

          <div className="mx-auto w-full max-w-[640px] lg:max-w-none">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-gray-950 shadow-2xl shadow-purple-950/20 ring-1 ring-purple-200/60 dark:border-white/10 dark:ring-purple-700/40">
              <Image
                src="/images/hero-ai-portrait-triptych.webp"
                alt={t('visualAlt')}
                width={682}
                height={630}
                priority
                sizes="(max-width: 1023px) 92vw, 44vw"
                className="h-auto w-full"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-purple-950/20 via-transparent to-white/5"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
