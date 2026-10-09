export type PricingOfferId =
  | 'v2:weekly'
  | 'v2:annual'
  | 'v2_package_10'
  | 'v2_package_100'
  | 'v2_package_500';

export type BillingCadence = 'oneTime' | 'weekly' | 'annual';

export type PricingOffer = {
  id: PricingOfferId;
  cadence: BillingCadence;
  price: number;
  credits: number;
  creditGrantPeriod: 'oneTime' | 'weekly';
};

export type PricingCatalog = {
  catalogVersion: 'v2';
  currency: string;
  referenceMarket: string;
  adaptivePricing: boolean;
  subscriptions: readonly PricingOffer[];
  packages: readonly PricingOffer[];
};

export const CREDIT_USD_REFERENCE_VALUE = 0.03;
export const SUBSCRIPTION_WEEKS_PER_YEAR = 52;
// Matches the base-photo estimate in KMP's PurchaseOfferPricing.
export const ESTIMATED_CREDITS_PER_PHOTO = 4;

export function estimatedPhotoCount(credits: number): number {
  return Math.floor(credits / ESTIMATED_CREDITS_PER_PHOTO);
}

export const CREDIT_COSTS = {
  studioPhoto: 4,
  personalModelImage: 2,
  standardTraining: 150,
  fullTraining: 300,
} as const;

// Reference display offers; the app/store confirms the buyer's localized price.
export const US_REFERENCE_PRICING = {
  catalogVersion: 'v2',
  currency: 'USD',
  referenceMarket: 'US',
  adaptivePricing: true,
  subscriptions: [
    {
      id: 'v2:annual',
      cadence: 'annual',
      price: 29.99,
      credits: 40,
      creditGrantPeriod: 'weekly',
    },
    {
      id: 'v2:weekly',
      cadence: 'weekly',
      price: 2.99,
      credits: 40,
      creditGrantPeriod: 'weekly',
    },
  ],
  packages: [
    {
      id: 'v2_package_10',
      cadence: 'oneTime',
      price: 0.99,
      credits: 10,
      creditGrantPeriod: 'oneTime',
    },
    {
      id: 'v2_package_100',
      cadence: 'oneTime',
      price: 5.99,
      credits: 100,
      creditGrantPeriod: 'oneTime',
    },
    {
      id: 'v2_package_500',
      cadence: 'oneTime',
      price: 14.99,
      credits: 500,
      creditGrantPeriod: 'oneTime',
    },
  ],
} as const satisfies PricingCatalog;

export function annualSavingsPercent(offers: readonly PricingOffer[]): number | null {
  const annual = offers.find((offer) => offer.cadence === 'annual');
  const weekly = offers.find((offer) => offer.cadence === 'weekly');
  if (!annual || !weekly || annual.credits !== weekly.credits || weekly.price <= 0) {
    return null;
  }

  const weeklyAnnualCost = weekly.price * SUBSCRIPTION_WEEKS_PER_YEAR;
  const percent = Math.round((1 - annual.price / weeklyAnnualCost) * 100);
  return percent > 0 && percent < 100 ? percent : null;
}

export function creditPackSavingsPercent(
  offers: readonly PricingOffer[],
  offer: PricingOffer,
): number | null {
  const smallest = offers.reduce<PricingOffer | undefined>(
    (current, candidate) => !current || candidate.credits < current.credits ? candidate : current,
    undefined,
  );
  if (
    !smallest
    || offer.cadence !== 'oneTime'
    || smallest.cadence !== 'oneTime'
    || offer.credits <= smallest.credits
  ) {
    return null;
  }

  const pricePerCredit = offer.price / offer.credits;
  const comparisonPrice = smallest.price / smallest.credits;
  if (
    !Number.isFinite(pricePerCredit)
    || pricePerCredit <= 0
    || !Number.isFinite(comparisonPrice)
    || comparisonPrice <= 0
  ) {
    return null;
  }

  const percent = Math.round((1 - pricePerCredit / comparisonPrice) * 100);
  return percent > 0 && percent < 100 ? percent : null;
}

export function formatCurrency(
  amount: number,
  currency: string,
  locale: string = 'en',
): string {
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
  };
  if (currency === 'THB' && Number.isInteger(amount)) {
    options.minimumFractionDigits = 0;
    options.maximumFractionDigits = 0;
  }
  return new Intl.NumberFormat(locale, options).format(amount);
}

export function formatCredits(credits: number, locale: string = 'en'): string {
  return `${new Intl.NumberFormat(locale).format(credits)} CR`;
}
