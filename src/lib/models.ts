export type ModelGroup = 'personal' | 'generate' | 'edit';

export type SupportedModel = {
  id: string;
  name: string;
  group: ModelGroup;
  tierKey: string;
  bestForKey: string;
  pricingKey: 'training' | 'personalPhoto' | 'photo';
  priceUsd: number;
  providerModel?: string;
};

export const TRAINING_PRICE_USD = 2.99;
export const PERSONAL_MODEL_PHOTO_PRICE_USD = 0.03;
export const LOWEST_GENERAL_MODEL_PRICE_USD = 0.09;

// Mirrors the backend generation model catalog. When adding, removing, or
// repricing models, update myaiphotoshoot-functions/supabase/functions/_shared/common/generation-models.ts too.
export const supportedModels: SupportedModel[] = [
  {
    id: 'personal_ai_model',
    name: 'Personal AI Model',
    group: 'personal',
    tierKey: 'personal',
    bestForKey: 'personal',
    pricingKey: 'personalPhoto',
    priceUsd: PERSONAL_MODEL_PHOTO_PRICE_USD,
  },
  {
    id: 'flux_2_pro',
    name: 'Flux 2 Pro',
    group: 'generate',
    tierKey: 'bestValue',
    bestForKey: 'realistic',
    pricingKey: 'photo',
    priceUsd: 0.09,
    providerModel: 'black-forest-labs/flux-2-pro',
  },
  {
    id: 'flux_2_max',
    name: 'Flux 2 Max',
    group: 'generate',
    tierKey: 'highDetail',
    bestForKey: 'detail',
    pricingKey: 'photo',
    priceUsd: 0.19,
    providerModel: 'black-forest-labs/flux-2-max',
  },
  {
    id: 'nano_banana_pro',
    name: 'Nano-Banana Pro',
    group: 'generate',
    tierKey: 'topQuality',
    bestForKey: 'quality',
    pricingKey: 'photo',
    priceUsd: 0.29,
    providerModel: 'google/nano-banana-pro',
  },
  {
    id: 'chatgpt_2',
    name: 'GPT Image 2',
    group: 'generate',
    tierKey: 'precise',
    bestForKey: 'precise',
    pricingKey: 'photo',
    priceUsd: 0.09,
    providerModel: 'openai/gpt-image-2',
  },
  {
    id: 'seedream_4_5',
    name: 'Seedream 4.5',
    group: 'generate',
    tierKey: 'creative',
    bestForKey: 'creative',
    pricingKey: 'photo',
    priceUsd: 0.09,
    providerModel: 'bytedance/seedream-4.5',
  },
  {
    id: 'qwen_image_2',
    name: 'Qwen Image 2',
    group: 'generate',
    tierKey: 'textPosters',
    bestForKey: 'textPosters',
    pricingKey: 'photo',
    priceUsd: 0.09,
    providerModel: 'qwen/qwen-image-2',
  },
  {
    id: 'nano_banana_2_lite',
    name: 'Nano Banana 2 Lite',
    group: 'edit',
    tierKey: 'standardEdits',
    bestForKey: 'edits',
    pricingKey: 'photo',
    priceUsd: 0.09,
    providerModel: 'google/nano-banana-2-lite',
  },
  {
    id: 'flux_kontext_max',
    name: 'Flux Kontext Max',
    group: 'edit',
    tierKey: 'proEdits',
    bestForKey: 'proEdits',
    pricingKey: 'photo',
    priceUsd: 0.19,
    providerModel: 'black-forest-labs/flux-kontext-max',
  },
  {
    id: 'nano_banana_2',
    name: 'Nano Banana Edit',
    group: 'edit',
    tierKey: 'smartEdits',
    bestForKey: 'smartEdits',
    pricingKey: 'photo',
    priceUsd: 0.29,
    providerModel: 'google/nano-banana-2',
  },
];

export function formatModelPriceUsd(priceUsd: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(priceUsd);
}
