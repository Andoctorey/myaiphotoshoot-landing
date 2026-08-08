export type PricingTierId = 'payg' | 'pro' | 'max';
export type PricingOfferId =
  | 'payg-30'
  | 'payg-100'
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
  price: number;
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

export type PricingCatalog = {
  currency: string;
  referenceMarket: string;
  countryGroup: 'A' | 'B' | 'C';
  adaptivePricing: boolean;
  creditsNeverExpire: boolean;
  trialAvailable: boolean;
  tiers: readonly PricingTier[];
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
  countryGroup: 'A',
  adaptivePricing: true,
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
          price: 5.99,
          credits: 200,
          creditGrantPeriod: 'oneTime',
        },
        {
          id: 'payg-300',
          cadence: 'oneTime',
          price: 8.99,
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
          price: 149.9,
          credits: 200,
          creditGrantPeriod: 'monthly',
          annualSavingsPercent: 17,
        },
        {
          id: 'pro-monthly',
          cadence: 'monthly',
          price: 14.99,
          credits: 200,
          creditGrantPeriod: 'monthly',
        },
        {
          id: 'pro-weekly',
          cadence: 'weekly',
          price: 6.99,
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
          price: 299.9,
          credits: 400,
          creditGrantPeriod: 'monthly',
          annualSavingsPercent: 17,
        },
        {
          id: 'max-monthly',
          cadence: 'monthly',
          price: 29.99,
          credits: 400,
          creditGrantPeriod: 'monthly',
        },
      ],
    },
  ],
} as const satisfies PricingCatalog;

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
