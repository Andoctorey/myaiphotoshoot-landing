export type PricingTierId = 'payg' | 'pro' | 'max';
export type PricingOfferId =
  | 'payg-200'
  | 'payg-300'
  | 'pro-weekly'
  | 'pro-monthly'
  | 'pro-annual'
  | 'max-monthly'
  | 'max-annual';
export type BillingCadence = 'oneTime' | 'weekly' | 'monthly' | 'annual';
export type CreditGrantPeriod = 'oneTime' | 'weekly' | 'monthly';
export type TrainingEntitlement = 'standard' | 'full' | null;

export type PricingOffer = {
  id: PricingOfferId;
  cadence: BillingCadence;
  priceUsd: number;
  credits: number;
  creditGrantPeriod: CreditGrantPeriod;
  annualSavingsPercent?: number;
};

export type PricingTier = {
  id: PricingTierId;
  defaultOfferId: PricingOfferId;
  maxResolution: '1K' | '2K' | '4K';
  training: TrainingEntitlement;
  offers: readonly PricingOffer[];
};

export type CreditCost = {
  id:
    | 'personalModelImage'
    | 'standardImage'
    | 'proImage'
    | 'maxImage'
    | 'standardTraining'
    | 'fullTraining';
  minCredits: number;
  maxCredits: number;
};

export const CREDIT_USD_REFERENCE_VALUE = 0.03;

export const CREDIT_COSTS = [
  {
    id: 'standardImage',
    minCredits: 3,
    maxCredits: 3,
  },
  {
    id: 'proImage',
    minCredits: 7,
    maxCredits: 10,
  },
  {
    id: 'maxImage',
    minCredits: 20,
    maxCredits: 20,
  },
  {
    id: 'personalModelImage',
    minCredits: 2,
    maxCredits: 2,
  },
  {
    id: 'standardTraining',
    minCredits: 150,
    maxCredits: 150,
  },
  {
    id: 'fullTraining',
    minCredits: 300,
    maxCredits: 300,
  },
] as const satisfies readonly CreditCost[];

export const US_REFERENCE_PRICING = {
  currency: 'USD',
  referenceMarket: 'US',
  creditsNeverExpire: true,
  trialAvailable: false,
  tiers: [
    {
      id: 'payg',
      defaultOfferId: 'payg-200',
      maxResolution: '1K',
      training: null,
      offers: [
        {
          id: 'payg-200',
          cadence: 'oneTime',
          priceUsd: 5.99,
          credits: 200,
          creditGrantPeriod: 'oneTime',
        },
        {
          id: 'payg-300',
          cadence: 'oneTime',
          priceUsd: 8.99,
          credits: 300,
          creditGrantPeriod: 'oneTime',
        },
      ],
    },
    {
      id: 'pro',
      defaultOfferId: 'pro-annual',
      maxResolution: '2K',
      training: 'standard',
      offers: [
        {
          id: 'pro-annual',
          cadence: 'annual',
          priceUsd: 149.9,
          credits: 200,
          creditGrantPeriod: 'monthly',
          annualSavingsPercent: 17,
        },
        {
          id: 'pro-monthly',
          cadence: 'monthly',
          priceUsd: 14.99,
          credits: 200,
          creditGrantPeriod: 'monthly',
        },
        {
          id: 'pro-weekly',
          cadence: 'weekly',
          priceUsd: 6.99,
          credits: 100,
          creditGrantPeriod: 'weekly',
        },
      ],
    },
    {
      id: 'max',
      defaultOfferId: 'max-annual',
      maxResolution: '4K',
      training: 'full',
      offers: [
        {
          id: 'max-annual',
          cadence: 'annual',
          priceUsd: 299.9,
          credits: 400,
          creditGrantPeriod: 'monthly',
          annualSavingsPercent: 17,
        },
        {
          id: 'max-monthly',
          cadence: 'monthly',
          priceUsd: 29.99,
          credits: 400,
          creditGrantPeriod: 'monthly',
        },
      ],
    },
  ] satisfies readonly PricingTier[],
} as const;

export function formatUsd(amountUsd: number, locale: string = 'en'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: US_REFERENCE_PRICING.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountUsd);
}
