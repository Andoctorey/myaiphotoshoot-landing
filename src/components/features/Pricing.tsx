import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { localePath } from '@/lib/seo';
import PricingPlans from './PricingPlans';

export default async function Pricing({ locale }: { locale: string }) {
  const [t, tNav] = await Promise.all([
    getTranslations({ locale, namespace: 'pricing' }),
    getTranslations({ locale, namespace: 'navigation' }),
  ]);

  return (
    <section id="pricing" className="scroll-mt-16 bg-white py-12 dark:bg-gray-900 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            {t('title')}
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-gray-600 dark:text-gray-300">
            {t('description')}
          </p>
          <p className="mt-3 text-sm">
            <Link
              href={localePath(locale, '/studio/')}
              className="font-semibold text-purple-700 underline decoration-purple-300 underline-offset-4 hover:text-purple-900 dark:text-purple-300 dark:decoration-purple-700 dark:hover:text-purple-100"
            >
              {tNav('studio')}
            </Link>
          </p>
        </div>

        <PricingPlans locale={locale} />
      </div>
    </section>
  );
}
