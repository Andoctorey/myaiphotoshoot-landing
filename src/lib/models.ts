import {
  CREDIT_COSTS,
  type CreditCost,
  type PricingTierId,
} from '@/lib/pricing';

export type ModelGroup = 'personal' | 'generate' | 'edit';

export type SupportedModel = {
  id: string;
  name: string;
  group: ModelGroup;
  tierKey: string;
  bestForKey: string;
  creditCost: number;
  accessTier: PricingTierId;
  maxResolution: '1K' | '2K' | '4K';
  providerModel?: string;
};

function creditCost(id: CreditCost['id']): CreditCost {
  const cost = CREDIT_COSTS.find((item) => item.id === id);
  if (!cost) {
    throw new Error(`Missing credit cost for "${id}".`);
  }
  return cost;
}

function fixedCreditCost(id: CreditCost['id']): number {
  const cost = creditCost(id);
  if (cost.minCredits !== cost.maxCredits) {
    throw new Error(`Expected a fixed credit cost for "${id}".`);
  }
  return cost.minCredits;
}

const PERSONAL_MODEL_IMAGE_CREDITS = fixedCreditCost('personalModelImage');
const STANDARD_IMAGE_CREDITS = fixedCreditCost('standardImage');
const PRO_IMAGE_CREDITS = creditCost('proImage');
const PRO_IMAGE_MIN_CREDITS = PRO_IMAGE_CREDITS.minCredits;
const PRO_IMAGE_MAX_CREDITS = PRO_IMAGE_CREDITS.maxCredits;
const MAX_IMAGE_CREDITS = fixedCreditCost('maxImage');

export const STANDARD_TRAINING_CREDITS = fixedCreditCost('standardTraining');
export const FULL_TRAINING_CREDITS = fixedCreditCost('fullTraining');
export const LOWEST_GENERATION_CREDITS = STANDARD_IMAGE_CREDITS;
export const PERSONAL_MODEL_PHOTO_CREDITS = PERSONAL_MODEL_IMAGE_CREDITS;

// Mirrors the public generation-model catalog and the plan entitlement mapping.
// Keep this list aligned with the backend when models, costs, or access tiers change.
export const supportedModels: SupportedModel[] = [
  {
    id: 'personal_ai_model',
    name: 'Personal AI Model',
    group: 'personal',
    tierKey: 'personal',
    bestForKey: 'personal',
    creditCost: PERSONAL_MODEL_IMAGE_CREDITS,
    accessTier: 'pro',
    maxResolution: '1K',
  },
  {
    id: 'flux_2_pro',
    name: 'Flux 2 Pro',
    group: 'generate',
    tierKey: 'bestValue',
    bestForKey: 'realistic',
    creditCost: STANDARD_IMAGE_CREDITS,
    accessTier: 'payg',
    maxResolution: '1K',
    providerModel: 'black-forest-labs/flux-2-pro',
  },
  {
    id: 'flux_2_max',
    name: 'Flux 2 Max',
    group: 'generate',
    tierKey: 'highDetail',
    bestForKey: 'detail',
    creditCost: PRO_IMAGE_MIN_CREDITS,
    accessTier: 'payg',
    maxResolution: '1K',
    providerModel: 'black-forest-labs/flux-2-max',
  },
  {
    id: 'nano_banana_pro',
    name: 'Nano-Banana Pro',
    group: 'generate',
    tierKey: 'topQuality',
    bestForKey: 'quality',
    creditCost: PRO_IMAGE_MAX_CREDITS,
    accessTier: 'pro',
    maxResolution: '2K',
    providerModel: 'google/nano-banana-pro',
  },
  {
    id: 'nano_banana_pro_4k',
    name: 'Nano-Banana Pro 4K',
    group: 'generate',
    tierKey: 'topQuality',
    bestForKey: 'quality',
    creditCost: MAX_IMAGE_CREDITS,
    accessTier: 'max',
    maxResolution: '4K',
    providerModel: 'google/nano-banana-pro',
  },
  {
    id: 'chatgpt_2',
    name: 'GPT Image 2',
    group: 'generate',
    tierKey: 'precise',
    bestForKey: 'precise',
    creditCost: STANDARD_IMAGE_CREDITS,
    accessTier: 'payg',
    maxResolution: '1K',
    providerModel: 'openai/gpt-image-2',
  },
  {
    id: 'seedream_4_5',
    name: 'Seedream 4.5',
    group: 'generate',
    tierKey: 'creative',
    bestForKey: 'creative',
    creditCost: STANDARD_IMAGE_CREDITS,
    accessTier: 'payg',
    maxResolution: '1K',
    providerModel: 'bytedance/seedream-4.5',
  },
  {
    id: 'qwen_image_2',
    name: 'Qwen Image 2',
    group: 'generate',
    tierKey: 'textPosters',
    bestForKey: 'textPosters',
    creditCost: STANDARD_IMAGE_CREDITS,
    accessTier: 'payg',
    maxResolution: '1K',
    providerModel: 'qwen/qwen-image-2',
  },
  {
    id: 'nano_banana_2_lite',
    name: 'Nano Banana 2 Lite',
    group: 'edit',
    tierKey: 'standardEdits',
    bestForKey: 'edits',
    creditCost: STANDARD_IMAGE_CREDITS,
    accessTier: 'payg',
    maxResolution: '1K',
    providerModel: 'google/nano-banana-2-lite',
  },
  {
    id: 'flux_kontext_max',
    name: 'Flux Kontext Max',
    group: 'edit',
    tierKey: 'proEdits',
    bestForKey: 'proEdits',
    creditCost: PRO_IMAGE_MIN_CREDITS,
    accessTier: 'payg',
    maxResolution: '1K',
    providerModel: 'black-forest-labs/flux-kontext-max',
  },
  {
    id: 'nano_banana_2',
    name: 'Nano Banana Edit',
    group: 'edit',
    tierKey: 'smartEdits',
    bestForKey: 'smartEdits',
    creditCost: PRO_IMAGE_MIN_CREDITS,
    accessTier: 'pro',
    maxResolution: '2K',
    providerModel: 'google/nano-banana-2',
  },
];

export function formatCreditCost(credits: number): string {
  return `${credits} CR`;
}
