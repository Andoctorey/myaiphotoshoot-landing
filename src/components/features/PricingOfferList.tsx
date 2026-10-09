'use client';

import { useTranslations } from '@/lib/utils';
import {
  annualSavingsPercent,
  creditPackSavingsPercent,
  estimatedPhotoCount,
  formatCurrency,
  SUBSCRIPTION_WEEKS_PER_YEAR,
  type PricingCatalog,
} from '@/lib/pricing';

type Props = {
  kind: 'subscription' | 'packs';
  pricing: PricingCatalog;
  locale: string;
};

export default function PricingOfferList({ kind, pricing, locale }: Props) {
  const t = useTranslations('pricing');
  const isSubscription = kind === 'subscription';
  const offers = isSubscription ? pricing.subscriptions : pricing.packages;
  const annualSavings = isSubscription ? annualSavingsPercent(offers) : null;
  const money = (amount: number) => formatCurrency(amount, pricing.currency, locale);
  const number = new Intl.NumberFormat(locale);
  const options = offers.map((offer) => {
    let savings = null;
    if (!isSubscription) savings = creditPackSavingsPercent(offers, offer);
    else if (offer.cadence === 'annual') savings = annualSavings;
    return { offer, savings };
  });
  if (!offers.length) return null;

  return (
    <section aria-labelledby={`pricing-${kind}`}>
      <h3 id={`pricing-${kind}`} className="text-xl font-semibold text-on-surface">
        {t(`${kind}.title`)}
      </h3>
      <dl className="mt-4 space-y-3">
        {options.map(({ offer, savings }) => (
          <div key={offer.id} className="flex items-center justify-between gap-4 rounded-2xl border border-outline-variant/70 bg-surface px-4 py-4 sm:px-5">
            <dt className="min-w-0">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-on-surface">
                  {isSubscription
                    ? t(`billing.${offer.cadence}`)
                    : t('creditAmount', { credits: number.format(offer.credits) })}
                </span>
                {savings !== null ? (
                  <span className="rounded-full bg-gradient-to-r from-primary to-[#7050b8] px-2.5 py-1 text-xs font-semibold leading-4 text-on-primary dark:to-[#a78bfa]">
                    {t(isSubscription ? 'billing.annualSavings' : 'packs.savings', {
                      percent: number.format(savings),
                    })}
                  </span>
                ) : null}
              </span>
              <span className="mt-1 block text-sm font-medium text-on-surface">
                {t(isSubscription ? 'weeklyPhotoEstimate' : 'photoEstimate', {
                  photos: number.format(estimatedPhotoCount(offer.credits)),
                })}
              </span>
              {isSubscription ? (
                <span className="mt-0.5 block text-xs text-on-surface-variant">
                  {t('billing.weeklyCredits', { credits: number.format(offer.credits) })}
                </span>
              ) : null}
            </dt>
            <dd className="shrink-0 text-end">
              <span className="block whitespace-nowrap text-xl font-semibold tabular-nums text-on-surface">
                <bdi>
                  {offer.cadence === 'oneTime'
                    ? money(offer.price)
                    : t('billing.weeklyPrice', {
                      price: money(offer.cadence === 'annual'
                        ? offer.price / SUBSCRIPTION_WEEKS_PER_YEAR
                        : offer.price),
                    })}
                </bdi>
              </span>
              {offer.cadence === 'annual' ? (
                <span className="ms-auto mt-1 block max-w-36 text-xs text-on-surface-variant">
                  {t('billing.annualCharge', { price: money(offer.price) })}
                </span>
              ) : offer.cadence === 'oneTime' ? (
                <span className="mt-0.5 block text-xs text-on-surface-variant">
                  {t('billing.oneTime')}
                </span>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 space-y-1 text-xs leading-5 text-on-surface-variant">
        <p>{t(`${kind}.expiry`)}</p>
        {isSubscription ? <p>{t('subscription.cancel')}</p> : null}
      </div>
    </section>
  );
}
