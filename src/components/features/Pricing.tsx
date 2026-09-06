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
    <section id="pricing" className="scroll-mt-16 bg-white py-10 dark:bg-gray-900 md:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            {t('title')}
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-lg text-gray-600 dark:text-gray-300">
            {t('description')}
          </p>
          <p className="mt-2 text-sm">
            <Link
              href={localePath(locale, '/studio/')}
              className="font-semibold text-primary underline decoration-brand-300 underline-offset-4 hover:text-primary/80 dark:decoration-brand-700"
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
