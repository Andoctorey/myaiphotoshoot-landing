import { CREDIT_COSTS } from '@/lib/pricing';

export const studioPhotoCredits = CREDIT_COSTS.studioPhoto;

export const personalModelCosts = {
  imageCredits: CREDIT_COSTS.personalModelImage,
  standardTrainingCredits: CREDIT_COSTS.standardTraining,
  fullTrainingCredits: CREDIT_COSTS.fullTraining,
} as const;
