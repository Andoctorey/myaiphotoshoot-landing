import { getTranslations } from 'next-intl/server';
import {
  ShieldCheckIcon,
  SparklesIcon,
  PhotoIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline';

export default async function Features({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'features' });

  const features = [
    {
      name: t('advancedAI.title'),
      description: t('advancedAI.description'),
      icon: SparklesIcon,
    },
    {
      name: t('thousandsOfStyles.title'),
      description: t('thousandsOfStyles.description'),
      icon: PhotoIcon,
    },
    {
      name: t('privacyFirst.title'),
      description: t('privacyFirst.description'),
      icon: ShieldCheckIcon,
    },
    {
      name: t('multiplatform.title'),
      description: t('multiplatform.description'),
      icon: DevicePhoneMobileIcon,
    },
  ];

  return (
    <section id="features" className="bg-white py-12 dark:bg-gray-900 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              {t('title')}
            </h2>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              {t('description')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.name}
              className="relative p-5 bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-700 transition-colors duration-300"
            >
              <div className="absolute top-5 ltr:left-5 rtl:right-5">
                <feature.icon
                  className="h-7 w-7 text-purple-600 dark:text-purple-400"
                  aria-hidden="true"
                />
              </div>
              <div className="ltr:ml-12 rtl:mr-12">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {feature.name}
                </h3>
                <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-300">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
