import { getTranslations } from 'next-intl/server';
import PlatformButtons from './PlatformButtons';

export default async function Download({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'download' });

  return (
    <section id="download" className="relative overflow-hidden bg-gradient-to-b from-white via-purple-50/40 to-gray-50 py-14 dark:from-gray-900 dark:via-purple-950/20 dark:to-gray-800 md:py-16">
      <div aria-hidden="true" className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-200/30 blur-3xl dark:bg-purple-800/15" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-purple-600 dark:bg-purple-400" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            {t('choosePlatform')}
          </h2>
        </div>

        {/* Download Options */}
        <div
          id="download-options"
          className="mx-auto flex max-w-4xl flex-col items-center"
        >
          <PlatformButtons
            webAppLabel={t('webApp.button')}
            googlePlayLabel={t('mobileApps.googlePlay')}
            appStoreLabel={t('mobileApps.appStore')}
          />
        </div>
      </div>
    </section>
  );
}
