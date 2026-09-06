'use client';

import { CheckIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { useTranslations } from '@/lib/utils';
import {
  formatCurrency,
  US_REFERENCE_PRICING,
  type PricingCatalog,
  type PricingOffer,
  type PricingOfferId,
  type PricingTier,
  type PricingTierId,
} from '@/lib/pricing';
import { pricingCatalogFromApi } from '@/lib/regional-pricing';
import PlatformAppLink from './PlatformAppLink';

type Props = {
  locale: string;
};

function formatInteger(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);
}

function offerUnitKey(offer: PricingOffer): string {
  if (offer.cadence === 'oneTime') return 'billing.units.oneTime';
  if (offer.cadence === 'weekly') return 'billing.units.perWeek';
  if (offer.cadence === 'annual') return 'billing.units.perYear';
  return 'billing.units.perMonth';
}

function offerCreditKey(offer: PricingOffer): string {
  if (offer.creditGrantPeriod === 'oneTime') return 'billing.oneTimeCredits';
  if (offer.creditGrantPeriod === 'weekly') return 'billing.weeklyCredits';
  return 'billing.monthlyCredits';
}

export default function PricingPlans({ locale }: Props) {
  const t = useTranslations('pricing');
  const [pricing, setPricing] = useState<PricingCatalog>(US_REFERENCE_PRICING);
  const [selectedTierId, setSelectedTierId] = useState<PricingTierId>('payg');
  const [selectedOfferIds, setSelectedOfferIds] = useState<
    Partial<Record<PricingTierId, PricingOfferId>>
  >({});

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ locale });

    fetch(`/pricing?${params.toString()}`, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Pricing request failed with ${response.status}`);
        const nextPricing = pricingCatalogFromApi(await response.json());
        if (!nextPricing) throw new Error('Pricing response was invalid');
        setPricing(nextPricing);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.warn('Localized pricing unavailable; using US reference pricing.', error);
        }
      });

    return () => {
      controller.abort();
    };
  }, [locale]);

  const selectedOffer = (tier: PricingTier): PricingOffer => (
    tier.offers.find((offer) => offer.id === selectedOfferIds[tier.id])
    || tier.offers.find((offer) => offer.id === tier.defaultOfferId)
    || tier.offers[0]
  );

  const activeTier = pricing.tiers.find((tier) => tier.id === selectedTierId) || pricing.tiers[0];
  if (!activeTier) return null;

  const offer = selectedOffer(activeTier);
  const featureLabels = [
    t(`plans.${activeTier.id}.features.resolution`, { resolution: activeTier.maxResolution }),
    activeTier.training
      ? t(`plans.${activeTier.id}.features.training`)
      : t('plans.payg.features.flexible'),
    t('creditsNeverExpire'),
  ];

  return (
    <div className="mx-auto mt-7 max-w-3xl">
      <div className="rounded-3xl border border-gray-200 bg-gray-50 p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-4">
        <fieldset>
          <legend className="sr-only">{t('title')}</legend>
          <div className="grid grid-cols-3 gap-1 rounded-2xl bg-gray-200/70 p-1 dark:bg-gray-900/70">
            {pricing.tiers.map((tier) => (
              <label key={tier.id} className="relative cursor-pointer">
                <input
                  type="radio"
                  name="pricing-tier"
                  value={tier.id}
                  checked={activeTier.id === tier.id}
                  onChange={() => setSelectedTierId(tier.id)}
                  className="peer sr-only"
                />
                <span className="flex min-h-11 items-center justify-center rounded-xl px-2 py-2 text-center text-sm font-bold text-gray-600 transition peer-checked:bg-primary peer-checked:text-on-primary peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-1 dark:text-gray-300">
                  {tier.id === 'payg' ? t('plans.payg.eyebrow') : t(`plans.${tier.id}.name`)}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <article className="mt-3 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900 sm:p-6">
          <h3 className="text-xl font-bold text-gray-950 dark:text-white">
            {t(`plans.${activeTier.id}.name`)}
          </h3>

          <fieldset className="mt-4">
            <legend className="sr-only">{t(`plans.${activeTier.id}.optionLabel`)}</legend>
            <div
              className={`grid gap-2 ${
                activeTier.offers.length === 1
                  ? 'grid-cols-1'
                  : activeTier.offers.length === 3
                    ? 'grid-cols-3'
                    : 'grid-cols-2'
              }`}
            >
              {activeTier.offers.map((candidate) => (
                <label key={candidate.id} className="relative cursor-pointer">
                  <input
                    type="radio"
                    name={`${activeTier.id}-offer`}
                    value={candidate.id}
                    checked={offer.id === candidate.id}
                    onChange={() => setSelectedOfferIds((current) => ({
                      ...current,
                      [activeTier.id]: candidate.id,
                    }))}
                    className="peer sr-only"
                  />
                  <span className="flex min-h-20 flex-col items-center justify-center rounded-xl border border-gray-200 px-2 py-2 text-center transition peer-checked:border-primary peer-checked:bg-brand-50 peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-1 dark:border-gray-700 dark:peer-checked:border-brand-500 dark:peer-checked:bg-brand-950/40">
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                      {activeTier.id === 'payg'
                        ? t('creditGuide.creditAmount', {
                            credits: formatInteger(candidate.credits, locale),
                          })
                        : t(`billing.cadences.${candidate.cadence}`)}
                    </span>
                    <span className="mt-1 text-base font-extrabold text-gray-950 dark:text-white">
                      {formatCurrency(candidate.price, pricing.currency, locale)}
                    </span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      {t(offerUnitKey(candidate))}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-4 flex flex-wrap items-center gap-2" aria-live="polite" aria-atomic="true">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              {t(offerCreditKey(offer), {
                credits: formatInteger(offer.credits, locale),
              })}
            </p>
            {offer.annualSavingsPercent ? (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                {t('billing.annualSavings', { percent: offer.annualSavingsPercent })}
              </span>
            ) : null}
          </div>

          {offer.cadence === 'annual' ? (
            <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
              {t('billing.annualTerms', {
                total: formatCurrency(offer.price, pricing.currency, locale),
                credits: formatInteger(offer.credits, locale),
              })}
            </p>
          ) : null}

          <ul className="mt-5 grid gap-2 sm:grid-cols-3">
            {featureLabels.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-2 rounded-xl bg-gray-50 px-3 py-2.5 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <PlatformAppLink
            className="mt-5 flex min-h-12 w-full items-center justify-center rounded-xl bg-black px-5 py-3 text-center text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
            ariaLabel={t(`plans.${activeTier.id}.cta`)}
            analyticsParams={{
              event_source: 'homepage_pricing',
              pricing_plan: activeTier.id,
              billing_cadence: offer.cadence,
              offer_id: offer.id,
              pricing_market: pricing.referenceMarket,
              pricing_country_group: pricing.countryGroup,
              displayed_price: offer.price,
              displayed_currency: pricing.currency,
              reference_credits: offer.credits,
              credit_grant_period: offer.creditGrantPeriod,
            }}
          >
            {t(`plans.${activeTier.id}.cta`)}
          </PlatformAppLink>
        </article>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center text-xs text-gray-500 dark:text-gray-400">
        <p>{t('referenceDisclosure', {
          market: pricing.referenceMarket,
          currency: pricing.currency,
        })}</p>
        {activeTier.id !== 'payg' ? <p>{t('noTrial')}</p> : null}
      </div>
    </div>
  );
}
