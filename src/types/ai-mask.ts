export type MaskAudienceGender = 'female' | 'male' | 'unisex';

export interface AiMaskCategory {
  id: string;
  slug: string;
  name: string;
  iconPath: string | null;
  sourceImageUrl: string;
  sourceImageVariants: Record<string, string>;
  audienceGender: MaskAudienceGender;
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
  avgDurationSeconds: number | null;
  sortOrder: number;
}

export interface AiMasksCatalog {
  categories: AiMaskCategory[];
  masks: AiMask[];
}
