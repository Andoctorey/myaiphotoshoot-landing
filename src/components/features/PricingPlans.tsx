'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from '@/lib/utils';
import { US_REFERENCE_PRICING, type PricingCatalog } from '@/lib/pricing';
import { pricingCatalogFromApi } from '@/lib/regional-pricing';
import PricingOfferList from './PricingOfferList';

export default function PricingPlans({ locale }: { locale: string }) {
  const t = useTranslations('pricing');
  const [pricing, setPricing] = useState<PricingCatalog>(US_REFERENCE_PRICING);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ locale });
    fetch(`/pricing?${params.toString()}`, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Pricing request failed with ${response.status}`);
        const catalog = pricingCatalogFromApi(await response.json());
        if (!catalog) throw new Error('Pricing response was not a valid V2 catalog');
        setPricing(catalog);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.warn('Localized pricing unavailable; using US reference pricing.', error);
        }
      });
    return () => controller.abort();
  }, [locale]);

  return (
    <div className="mx-auto mt-9 max-w-5xl">
      <div className="grid items-start gap-8 md:grid-cols-2 lg:gap-12">
        <PricingOfferList kind="subscription" pricing={pricing} locale={locale} />
        <PricingOfferList kind="packs" pricing={pricing} locale={locale} />
      </div>
      <p className="mx-auto mt-7 max-w-3xl text-center text-xs leading-5 text-on-surface-variant">
        {t('referenceDisclosure')}
      </p>
    </div>
  );
}
