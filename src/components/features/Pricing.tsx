import { CheckIcon } from '@heroicons/react/24/outline';
import { getTranslations } from 'next-intl/server';
import PlatformAppLink from './PlatformAppLink';

export default async function Pricing({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'pricing' });

  const features = [
    t('features.training'),
    t('features.custom'),
    t('features.privacy'),
    t('features.download'),
  ];

  return (
    <section id="pricing" className="bg-white py-12 dark:bg-gray-900 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            {t('title')}
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-gray-600 dark:text-gray-300">
            {t('description')}
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-5xl overflow-hidden rounded-3xl shadow-xl dark:shadow-purple-900/30 lg:flex">
          <div className="flex-1 bg-white px-6 py-8 dark:bg-gray-800 sm:px-8 lg:p-10">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">{t('payAsYouGo')}</h3>
            <p className="mt-4 text-base text-gray-500 dark:text-gray-300 sm:text-lg">
              {t('perfectFor')}
            </p>
            <div className="mt-7">
              <div className="flex items-center">
                <h4 className="flex-shrink-0 text-base font-semibold text-purple-600 dark:text-purple-400 ltr:pr-4 rtl:pl-4">
                  {t('whatsIncluded')}
                </h4>
                <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
              </div>
              <ul className="mt-5 grid gap-4 sm:grid-cols-2 sm:gap-x-8">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckIcon className="h-5 w-5 text-green-500" aria-hidden="true" />
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 ltr:ml-3 rtl:mr-3 sm:text-base">{feature}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 px-6 py-8 text-center dark:bg-gray-700 dark:from-purple-900/20 dark:to-indigo-900/20 sm:px-8 lg:flex lg:w-[38%] lg:flex-shrink-0 lg:flex-col lg:justify-center lg:p-10">
            <div className="flex items-center justify-center text-5xl font-extrabold text-gray-900 dark:text-white">
              <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">{t('price')}</span>
              <span className="text-xl font-medium text-gray-500 dark:text-gray-300 ltr:ml-3 rtl:mr-3">{t('perPhoto')}</span>
            </div>
            <div className="mt-6">
              <div className="rounded-xl shadow-md">
                <PlatformAppLink
                  className="flex items-center justify-center rounded-xl border border-transparent bg-gradient-to-r from-purple-600 to-indigo-600 px-7 py-4 text-base font-semibold text-white transition-all duration-200 hover:from-purple-700 hover:to-indigo-700 hover:scale-[1.02]"
                >
                  {t('getStarted')}
                </PlatformAppLink>
              </div>
            </div>
            <div className="mt-5 rounded-2xl bg-white/60 p-4 backdrop-blur-sm dark:bg-gray-800/60">
              <p className="text-base font-bold text-gray-900 dark:text-white">{t('oneTimeFee')}</p>
              <p className="mt-1 text-2xl font-extrabold text-purple-600 dark:text-purple-400">{t('oneTimeFeeAmount')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
