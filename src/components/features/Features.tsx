import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import {
  AdjustmentsHorizontalIcon,
  SparklesIcon,
  PhotoIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline';
import { localePath } from '@/lib/seo';

export default async function Features({ locale }: { locale: string }) {
  const [t, tNav] = await Promise.all([
    getTranslations({ locale, namespace: 'features' }),
    getTranslations({ locale, namespace: 'navigation' }),
  ]);

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
      name: t('easyCustomization.title'),
      description: t('easyCustomization.description'),
      icon: AdjustmentsHorizontalIcon,
      href: localePath(locale, '/studio/'),
      linkLabel: tNav('studio'),
    },
    {
      name: t('multiplatform.title'),
      description: t('multiplatform.description'),
      icon: DevicePhoneMobileIcon,
    },
  ] satisfies Array<{
    name: string;
    description: string;
    icon: typeof SparklesIcon;
    href?: string;
    linkLabel?: string;
  }>;

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
                {feature.href && feature.linkLabel && (
                  <Link
                    href={feature.href}
                    className="mt-3 inline-flex rounded-sm text-sm font-semibold text-purple-700 underline decoration-purple-300 underline-offset-4 hover:text-purple-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 dark:text-purple-300 dark:decoration-purple-700 dark:hover:text-purple-100"
                  >
                    {feature.linkLabel}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
