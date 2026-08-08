import {
  CREDIT_COSTS,
  US_REFERENCE_PRICING,
  type CreditCost,
  type PricingTierId,
} from '@/lib/pricing';

export type QualityBand = {
  id: PricingTierId;
  minCredits: number;
  maxCredits: number;
  maxResolution: '1K' | '2K' | '4K';
};

function creditCost(id: CreditCost['id']): CreditCost {
  const cost = CREDIT_COSTS.find((item) => item.id === id);
  if (!cost) {
    throw new Error(`Missing credit cost for "${id}".`);
  }
  return cost;
}

function maxResolution(id: PricingTierId): QualityBand['maxResolution'] {
  const tier = US_REFERENCE_PRICING.tiers.find((item) => item.id === id);
  if (!tier) {
    throw new Error(`Missing pricing tier for "${id}".`);
  }
  return tier.maxResolution;
}

const standardImage = creditCost('standardImage');
const proImage = creditCost('proImage');
const maxImage = creditCost('maxImage');

export const qualityBands: readonly QualityBand[] = [
  {
    id: 'payg',
    minCredits: standardImage.minCredits,
    maxCredits: standardImage.maxCredits,
    maxResolution: maxResolution('payg'),
  },
  {
    id: 'pro',
    minCredits: proImage.minCredits,
    maxCredits: proImage.maxCredits,
    maxResolution: maxResolution('pro'),
  },
  {
    id: 'max',
    minCredits: maxImage.minCredits,
    maxCredits: maxImage.maxCredits,
    maxResolution: maxResolution('max'),
  },
] as const;

const personalModelImage = creditCost('personalModelImage');
const standardTraining = creditCost('standardTraining');
const fullTraining = creditCost('fullTraining');

export const personalModelCosts = {
  imageCredits: personalModelImage.minCredits,
  standardTrainingCredits: standardTraining.minCredits,
  fullTrainingCredits: fullTraining.minCredits,
} as const;

export function formatCreditRange(
  minCredits: number,
  maxCredits: number,
  locale: string,
): string {
  const formatter = new Intl.NumberFormat(locale);
  if (minCredits === maxCredits) {
    return formatter.format(minCredits);
  }
  return `${formatter.format(minCredits)}–${formatter.format(maxCredits)}`;
}
