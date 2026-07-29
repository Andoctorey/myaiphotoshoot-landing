import { getTranslations } from 'next-intl/server';
import PricingPlans from './PricingPlans';

export default async function Pricing({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'pricing' });

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
        </div>

        <PricingPlans locale={locale} />
      </div>
    </section>
  );
}
