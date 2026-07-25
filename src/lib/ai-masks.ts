import { defaultLocale } from '@/i18n/request';
import { postPublicSupabaseRpc } from '@/lib/public-supabase';
import type {
  AiMask,
  AiMaskCategory,
  AiMasksCatalog,
  MaskAudienceGender,
} from '@/types/ai-mask';

const MASKS_REVALIDATE_SECONDS = 3600;
const EMPTY_CATALOG: AiMasksCatalog = { categories: [], masks: [] };
const MASK_AUDIENCES = new Set<MaskAudienceGender>(['female', 'male', 'unisex']);

type MaskCategoryRow = {
  id: string;
  slug: string;
  name: string;
  icon_path?: string | null;
  source_image_url: string;
  source_image_variants?: unknown;
  audience_gender: MaskAudienceGender;
  sort_order: number;
};

type MaskRow = {
  id: string;
  category_id: string;
  slug: string;
  name: string;
  featured_graphics: string;
  featured_graphics_variants?: unknown;
  price_usd: number | string;
  avg_duration_seconds?: number | string | null;
  sort_order: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeImageVariants(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter((entry): entry is [string, string] => (
        entry[0].trim().length > 0
        && typeof entry[1] === 'string'
        && entry[1].trim().length > 0
      ))
      .map(([key, url]) => [key, url.trim()]),
  );
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isMaskCategoryRow(value: unknown): value is MaskCategoryRow {
  if (!isRecord(value)) return false;
  return typeof value.id === 'string'
    && typeof value.slug === 'string'
    && typeof value.name === 'string'
    && typeof value.source_image_url === 'string'
    && typeof value.audience_gender === 'string'
    && MASK_AUDIENCES.has(value.audience_gender as MaskAudienceGender)
    && typeof value.sort_order === 'number';
}

function isMaskRow(value: unknown): value is MaskRow {
  if (!isRecord(value)) return false;
  return typeof value.id === 'string'
    && typeof value.category_id === 'string'
    && typeof value.slug === 'string'
    && typeof value.name === 'string'
    && typeof value.featured_graphics === 'string'
    && normalizeNumber(value.price_usd) !== null
    && typeof value.sort_order === 'number';
}

function normalizeCategory(row: MaskCategoryRow): AiMaskCategory {
  return {
    id: row.id.trim(),
    slug: row.slug.trim(),
    name: row.name.trim(),
    iconPath: typeof row.icon_path === 'string' && row.icon_path.trim()
      ? row.icon_path.trim()
      : null,
    sourceImageUrl: row.source_image_url.trim(),
    sourceImageVariants: normalizeImageVariants(row.source_image_variants),
    audienceGender: row.audience_gender,
    sortOrder: row.sort_order,
  };
}

function normalizeMask(row: MaskRow): AiMask {
  return {
    id: row.id.trim(),
    categoryId: row.category_id.trim(),
    slug: row.slug.trim(),
    name: row.name.trim(),
    featuredGraphics: row.featured_graphics.trim(),
    featuredGraphicsVariants: normalizeImageVariants(row.featured_graphics_variants),
    priceUsd: normalizeNumber(row.price_usd) ?? 0,
    avgDurationSeconds: normalizeNumber(row.avg_duration_seconds),
    sortOrder: row.sort_order,
  };
}

function hasDuplicate(values: string[]): boolean {
  return new Set(values).size !== values.length;
}

async function fetchMasksCatalogInternal(locale: string, strict: boolean): Promise<AiMasksCatalog> {
  try {
    const [categoriesResponse, masksResponse] = await Promise.all([
      postPublicSupabaseRpc(
        'list_ai_mask_categories',
        { p_locale: locale },
        MASKS_REVALIDATE_SECONDS,
      ),
      postPublicSupabaseRpc(
        'list_ai_masks',
        { p_locale: locale },
        MASKS_REVALIDATE_SECONDS,
      ),
    ]);

    if (!categoriesResponse.ok || !masksResponse.ok) {
      throw new Error(
        `Mask RPCs returned categories ${categoriesResponse.status} and masks ${masksResponse.status}.`,
      );
    }

    const [categoryData, maskData]: [unknown, unknown] = await Promise.all([
      categoriesResponse.json(),
      masksResponse.json(),
    ]);
    if (!Array.isArray(categoryData) || !Array.isArray(maskData)) {
      throw new Error('Mask catalog RPC response was not an array.');
    }
    if (categoryData.some((row) => !isMaskCategoryRow(row)) || maskData.some((row) => !isMaskRow(row))) {
      throw new Error('Mask catalog RPC response contained an invalid record.');
    }

    const categories = categoryData.map(normalizeCategory);
    const masks = maskData.map(normalizeMask);
    const categoryIds = new Set(categories.map((category) => category.id));
    const hasInvalidCategory = categories.some((category) => (
      !category.id
      || !category.slug
      || !category.name
      || !category.sourceImageUrl
    ));
    const hasInvalidMask = masks.some((mask) => (
      !mask.id
      || !mask.categoryId
      || !mask.slug
      || !mask.name
      || !mask.featuredGraphics
      || mask.priceUsd <= 0
      || !categoryIds.has(mask.categoryId)
    ));

    if (
      hasInvalidCategory
      || hasInvalidMask
      || hasDuplicate(categories.map((category) => category.id))
      || hasDuplicate(categories.map((category) => category.slug))
      || hasDuplicate(masks.map((mask) => mask.id))
    ) {
      throw new Error('Mask catalog contained invalid or duplicate records.');
    }
    if (strict && (categories.length === 0 || masks.length === 0)) {
      throw new Error('Mask catalog contained no published masks.');
    }

    return { categories, masks };
  } catch (error) {
    if (strict) {
      throw new Error(`Failed to fetch the AI mask catalog for locale "${locale}".`, {
        cause: error,
      });
    }
    console.error(`Failed to load the AI mask catalog for locale "${locale}".`, error);
    return EMPTY_CATALOG;
  }
}

export function fetchMasksCatalog(locale: string = defaultLocale): Promise<AiMasksCatalog> {
  return fetchMasksCatalogInternal(locale, false);
}

export function fetchMasksCatalogStrict(locale: string = defaultLocale): Promise<AiMasksCatalog> {
  return fetchMasksCatalogInternal(locale, true);
}

export function masksForCategory(catalog: AiMasksCatalog, categoryId: string): AiMask[] {
  return catalog.masks.filter((mask) => mask.categoryId === categoryId);
}

export function formatMaskPriceUsd(price: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}
