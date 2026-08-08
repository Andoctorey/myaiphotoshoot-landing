'use client';

import { CheckIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { useTranslations } from '@/lib/utils';
import {
  CREDIT_COSTS,
  formatUsd,
  US_REFERENCE_PRICING,
  type CreditCost,
  type PricingOffer,
  type PricingTier,
  type PricingTierId,
} from '@/lib/pricing';
import PlatformAppLink from './PlatformAppLink';

type Props = {
  locale: string;
};

const tierCardClasses: Record<PricingTierId, string> = {
  payg: 'border-purple-400 bg-white shadow-xl shadow-purple-900/10 ring-1 ring-purple-300 dark:border-purple-500 dark:bg-gray-800 dark:ring-purple-700',
  pro: 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800',
  max: 'border-indigo-300 bg-gradient-to-b from-indigo-50 to-white dark:border-indigo-700 dark:from-indigo-950/40 dark:to-gray-800',
};

const tierButtonClasses: Record<PricingTierId, string> = {
  payg: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700',
  pro: 'bg-gray-950 hover:bg-purple-700 dark:bg-white dark:text-gray-950 dark:hover:bg-purple-200',
  max: 'bg-indigo-700 hover:bg-indigo-800 dark:bg-indigo-500 dark:hover:bg-indigo-400',
};

function formatInteger(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);
}

function formatCreditCost(cost: CreditCost, locale: string): string {
  const min = formatInteger(cost.minCredits, locale);
  if (cost.minCredits === cost.maxCredits) return min;
  return `${min}–${formatInteger(cost.maxCredits, locale)}`;
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
  const [selectedOfferIds, setSelectedOfferIds] = useState<Record<PricingTierId, string>>(
    () => Object.fromEntries(
      US_REFERENCE_PRICING.tiers.map((tier) => [tier.id, tier.defaultOfferId]),
    ) as Record<PricingTierId, string>,
  );

  const selectedOffer = (tier: PricingTier): PricingOffer => (
    tier.offers.find((offer) => offer.id === selectedOfferIds[tier.id]) || tier.offers[0]
  );

  const featureLabels = (tier: PricingTier): string[] => {
    const labels = [
      t(`plans.${tier.id}.features.resolution`, { resolution: tier.maxResolution }),
    ];

    if (tier.training) {
      labels.push(t(`plans.${tier.id}.features.training`, {
        training: t(`creditGuide.items.${tier.training}Training`),
      }));
    } else {
      labels.push(t('plans.payg.features.flexible'));
    }

    labels.push(t('creditsNeverExpire'));
    return labels;
  };

  return (
    <>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-gray-600 dark:text-gray-300">
        <p>{t('referenceDisclosure', {
          market: US_REFERENCE_PRICING.referenceMarket,
          currency: US_REFERENCE_PRICING.currency,
        })}</p>
        <span className="hidden h-4 w-px bg-gray-300 dark:bg-gray-700 sm:block" aria-hidden="true" />
        <p>{t('creditsNeverExpire')}</p>
        <span className="hidden h-4 w-px bg-gray-300 dark:bg-gray-700 sm:block" aria-hidden="true" />
        <p>{t('noTrial')}</p>
      </div>

      <div className="mt-10 grid items-stretch gap-6 lg:grid-cols-3">
        {US_REFERENCE_PRICING.tiers.map((tier) => {
          const offer = selectedOffer(tier);
          const displayPrice = offer.priceUsd;

          return (
            <article
              key={tier.id}
              className={`flex h-full flex-col rounded-3xl border p-6 sm:p-7 ${tierCardClasses[tier.id]}`}
            >
              <p className="text-sm font-semibold uppercase tracking-wide text-purple-700 dark:text-purple-300">
                {t(`plans.${tier.id}.eyebrow`)}
              </p>
              <h3 className="mt-2 text-2xl font-bold text-gray-950 dark:text-white">
                {t(`plans.${tier.id}.name`)}
              </h3>
              <p className="mt-3 min-h-12 text-sm leading-6 text-gray-600 dark:text-gray-300">
                {t(`plans.${tier.id}.description`)}
              </p>

              <fieldset className="mt-6">
                <legend className="sr-only">{t(`plans.${tier.id}.optionLabel`)}</legend>
                <div
                  className={`grid rounded-xl bg-gray-100 p-1 dark:bg-gray-900/70 ${
                    tier.offers.length === 3 ? 'grid-cols-3' : 'grid-cols-2'
                  }`}
                >
                  {tier.offers.map((candidate) => (
                    <label key={candidate.id} className="relative cursor-pointer">
                      <input
                        type="radio"
                        name={`${tier.id}-offer`}
                        value={candidate.id}
                        checked={offer.id === candidate.id}
                        onChange={() => setSelectedOfferIds((current) => ({
                          ...current,
                          [tier.id]: candidate.id,
                        }))}
                        className="peer sr-only"
                      />
                      <span className="flex min-h-10 items-center justify-center rounded-lg px-2 py-2 text-center text-xs font-semibold text-gray-600 transition peer-checked:bg-white peer-checked:text-purple-700 peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-purple-500 peer-focus-visible:ring-offset-1 dark:text-gray-300 dark:peer-checked:bg-gray-700 dark:peer-checked:text-purple-200">
                        {tier.id === 'payg'
                          ? t('creditGuide.creditAmount', {
                              credits: formatInteger(candidate.credits, locale),
                            })
                          : t(`billing.cadences.${candidate.cadence}`)}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div
                className="mt-6 border-b border-gray-200 pb-6 dark:border-gray-700"
                aria-live="polite"
                aria-atomic="true"
              >
                <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
                  <span className="text-4xl font-extrabold tracking-tight text-gray-950 dark:text-white">
                    {formatUsd(displayPrice, locale)}
                  </span>
                  <span className="pb-1 text-sm font-medium text-gray-500 dark:text-gray-300">
                    {t(offerUnitKey(offer))}
                  </span>
                </div>

                {offer.annualSavingsPercent ? (
                  <p className="mt-2 inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                    {t('billing.annualSavings', { percent: offer.annualSavingsPercent })}
                  </p>
                ) : null}

                <p className="mt-3 text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {t(offerCreditKey(offer), {
                    credits: formatInteger(offer.credits, locale),
                  })}
                </p>

                {offer.cadence === 'annual' ? (
                  <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-300">
                    {t('billing.annualTerms', {
                      total: formatUsd(offer.priceUsd, locale),
                      credits: formatInteger(offer.credits, locale),
                    })}
                  </p>
                ) : null}
              </div>

              <ul className="mt-6 space-y-3">
                {featureLabels(tier).map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-200">
                    <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" aria-hidden="true" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-7">
                <PlatformAppLink
                  className={`flex min-h-12 w-full items-center justify-center rounded-xl px-5 py-3 text-center text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800 ${tierButtonClasses[tier.id]}`}
                  ariaLabel={t(`plans.${tier.id}.cta`)}
                  analyticsParams={{
                    event_source: 'homepage_pricing',
                    pricing_plan: tier.id,
                    billing_cadence: offer.cadence,
                    offer_id: offer.id,
                    reference_market: US_REFERENCE_PRICING.referenceMarket,
                    reference_price_usd: offer.priceUsd,
                    reference_currency: US_REFERENCE_PRICING.currency,
                    reference_credits: offer.credits,
                    credit_grant_period: offer.creditGrantPeriod,
                  }}
                >
                  {t(`plans.${tier.id}.cta`)}
                </PlatformAppLink>
              </div>
            </article>
          );
        })}
      </div>

      <aside
        className="mt-8 rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-6 dark:border-purple-900/50 dark:from-purple-950/30 dark:via-gray-800 dark:to-indigo-950/30 sm:p-8"
        aria-labelledby="credit-guide-title"
      >
        <div className="max-w-3xl">
          <h3 id="credit-guide-title" className="text-2xl font-bold text-gray-950 dark:text-white">
            {t('creditGuide.title')}
          </h3>
          <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
            {t('creditGuide.description')}
          </p>
        </div>

        <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CREDIT_COSTS.map((cost) => (
            <div
              key={cost.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm dark:border-gray-700 dark:bg-gray-900/70"
            >
              <dt className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {t(`creditGuide.items.${cost.id}`)}
              </dt>
              <dd className="shrink-0 text-sm font-extrabold text-purple-700 dark:text-purple-300">
                {t('creditGuide.creditAmount', {
                  credits: formatCreditCost(cost, locale),
                })}
              </dd>
            </div>
          ))}
        </dl>
      </aside>
    </>
  );
}
