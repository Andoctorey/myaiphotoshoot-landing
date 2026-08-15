export type MaskAudienceGender = 'female' | 'male' | 'unisex';

export interface AiMaskCategory {
  id: string;
  slug: string;
  name: string;
  iconPath: string | null;
  sourceImageUrl: string;
  sourceImageVariants: Record<string, string>;
  audienceGender: MaskAudienceGender;
  hiddenOnIos: boolean;
  sortOrder: number;
}

export interface AiMask {
  id: string;
  categoryId: string;
  slug: string;
  name: string;
  featuredGraphics: string;
  featuredGraphicsVariants: Record<string, string>;
  priceUsd: number;
  priceCredits: number;
  avgDurationSeconds: number | null;
  sortOrder: number;
}

export interface AiMasksCatalog {
  categories: AiMaskCategory[];
  masks: AiMask[];
}

export interface AiMaskCategoryLandingFaq {
  q: string;
  a: string;
}

export interface AiMaskCategoryLanding {
  categoryId: string;
  slug: string;
  locale: string;
  title: string;
  description: string;
  introduction: string;
  photoGuidance: string[];
  expectations: string[];
  limitations: string[];
  faqs: AiMaskCategoryLandingFaq[];
  updatedAt: string;
}
