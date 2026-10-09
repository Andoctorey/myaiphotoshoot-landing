import { getTranslations } from 'next-intl/server';
import PricingPlans from './PricingPlans';

export default async function Pricing({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'pricing' });

  return (
    <section id="pricing" className="scroll-mt-16 bg-background py-14 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            {t('title')}
          </h2>
        </div>

        <PricingPlans locale={locale} />
      </div>
    </section>
  );
}
