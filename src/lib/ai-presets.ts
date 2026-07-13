import type { Metadata } from 'next';
import { defaultLocale, locales } from '@/i18n/request';
import { buildAlternates, canonicalUrl, ogAlternateLocales, ogLocaleFromAppLocale } from '@/lib/seo';
import type { AiPreset, AiPresetFaq, AiPresetSeoSection } from '@/types/ai-preset';

const PRESET_REVALIDATE_SECONDS = 3600;
export const AI_PRESETS_PAGE_SIZE = 12;
const AI_PRESETS_MAX_PAGE_SIZE = 100;
const DEFAULT_SUPABASE_URL = 'https://trzgfajvyjpvbqedyxug.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyemdmYWp2eWpwdmJxZWR5eHVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM1NTA5MzAsImV4cCI6MjA0OTEyNjkzMH0.39Qdq2nTCuoIpAfc7L725MZA2ls3NegFy6zCjOTzW9M';
export const AI_PRESETS_INDEX_TITLE = 'AI Photo Presets | My AI Photo Shoot';
export const AI_PRESETS_INDEX_DESCRIPTION =
  'Browse quick AI photo presets for fun looks and shareable photo transformations.';

function getSupabaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL).replace(/\/$/, '');
}

function getSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
}

export function buildPresetAppUrl(slug: string): string {
  return `https://app.myaiphotoshoot.com/#preset/${encodeURIComponent(slug)}`;
}

export interface AiPresetsPage {
  presets: AiPreset[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

function normalizePositiveInteger(value: number, fallback: number): number {
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

export function aiPresetsPagePath(page: number): string {
  return page <= 1 ? '/presets/' : `/ai-presets/browse/${page}/`;
}

async function postAiPresetsRpc(body: Record<string, unknown>): Promise<Response> {
  // public.list_ai_presets is defined in myaiphotoshoot-functions migrations; update
  // src/types/ai-preset.ts and admin/src/lib/presetService.ts when its output changes.
  return fetch(`${getSupabaseUrl()}/rest/v1/rpc/list_ai_presets`, {
    method: 'POST',
    headers: {
      apikey: getSupabaseAnonKey(),
      authorization: `Bearer ${getSupabaseAnonKey()}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
    next: { revalidate: PRESET_REVALIDATE_SECONDS },
  });
}

export async function fetchAiPresetsPage(
  locale: string = defaultLocale,
  page: number = 1,
  pageSize: number = AI_PRESETS_PAGE_SIZE,
): Promise<AiPresetsPage> {
  const normalizedPage = normalizePositiveInteger(page, 1);
  const normalizedPageSize = Math.min(normalizePositiveInteger(pageSize, AI_PRESETS_PAGE_SIZE), AI_PRESETS_MAX_PAGE_SIZE);
  const offset = (normalizedPage - 1) * normalizedPageSize;

  try {
    let res = await postAiPresetsRpc({
      p_locale: locale,
      p_limit: normalizedPageSize,
      p_offset: offset,
    });
    let usedLegacyRpc = false;

    if (!res.ok) {
      res = await postAiPresetsRpc({ p_locale: locale });
      usedLegacyRpc = true;
      if (!res.ok) {
        return {
          presets: [],
          totalCount: 0,
          page: normalizedPage,
          pageSize: normalizedPageSize,
          totalPages: 1,
          hasPreviousPage: normalizedPage > 1,
          hasNextPage: false,
        };
      }
    }

    const data = await res.json();
    const allRows = Array.isArray(data)
      ? data.filter((item): item is AiPreset =>
          typeof item?.id === 'string' &&
          typeof item?.slug === 'string' &&
          typeof item?.name === 'string',
        ).map(normalizeAiPreset)
      : [];
    const presets = usedLegacyRpc
      ? allRows.slice(offset, offset + normalizedPageSize)
      : allRows;
    if (!usedLegacyRpc && normalizedPage > 1 && presets.length === 0) {
      const firstPage = await fetchAiPresetsPage(locale, 1, normalizedPageSize);
      return {
        ...firstPage,
        presets: [],
        page: normalizedPage,
        hasPreviousPage: true,
        hasNextPage: false,
      };
    }

    const totalCount = usedLegacyRpc
      ? allRows.length
      : presets[0]?.total_count || (normalizedPage === 1 ? presets.length : offset + presets.length);
    const totalPages = Math.max(1, Math.ceil(totalCount / normalizedPageSize));

    return {
      presets,
      totalCount,
      page: normalizedPage,
      pageSize: normalizedPageSize,
      totalPages,
      hasPreviousPage: normalizedPage > 1,
      hasNextPage: normalizedPage < totalPages,
    };
  } catch {
    return {
      presets: [],
      totalCount: 0,
      page: normalizedPage,
      pageSize: normalizedPageSize,
      totalPages: 1,
      hasPreviousPage: normalizedPage > 1,
      hasNextPage: false,
    };
  }
}

export async function fetchAiPresets(locale: string = defaultLocale): Promise<AiPreset[]> {
  const presets: AiPreset[] = [];
  let page = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    const result = await fetchAiPresetsPage(locale, page, AI_PRESETS_MAX_PAGE_SIZE);
    presets.push(...result.presets);
    hasNextPage = result.hasNextPage && result.presets.length > 0;
    page += 1;
  }

  return presets;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function normalizeSeoSections(value: unknown): AiPresetSeoSection[] | null {
  if (!Array.isArray(value)) return null;
  const sections = value
    .map((section) => {
      if (!section || typeof section !== 'object') return null;
      const record = section as Record<string, unknown>;
      if (typeof record.heading !== 'string' || !isStringArray(record.body)) return null;
      const body = record.body.map((text) => text.trim()).filter(Boolean);
      return record.heading.trim() && body.length
        ? { heading: record.heading.trim(), body }
        : null;
    })
    .filter((section): section is AiPresetSeoSection => Boolean(section));
  return sections.length ? sections : null;
}

function normalizeFaqs(value: unknown): AiPresetFaq[] | null {
  if (!Array.isArray(value)) return null;
  const faqs = value
    .map((faq) => {
      if (!faq || typeof faq !== 'object') return null;
      const record = faq as Record<string, unknown>;
      const q = typeof record.q === 'string' ? record.q.trim() : '';
      const a = typeof record.a === 'string' ? record.a.trim() : '';
      return q && a ? { q, a } : null;
    })
    .filter((faq): faq is AiPresetFaq => Boolean(faq));
  return faqs.length ? faqs : null;
}

function normalizeCost(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return Math.round(value * 100) / 100;
  }
  if (typeof value === 'string') {
    if (!value.trim()) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) / 100 : null;
  }
  return null;
}

export function normalizeAiPreset(preset: AiPreset): AiPreset {
  return {
    ...preset,
    cost: normalizeCost(preset.cost),
    seo_sections: normalizeSeoSections(preset.seo_sections),
    faqs: normalizeFaqs(preset.faqs),
  };
}

export function formatPresetCostUsd(cost: number | null | undefined, locale: string): string | null {
  if (cost === null || cost === undefined || !Number.isFinite(cost)) return null;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cost);
}

export async function fetchAiPreset(slug: string, locale: string): Promise<AiPreset | undefined> {
  const presets = await fetchAiPresets(locale);
  const preset = presets.find((item) => item.slug === slug);
  return preset ? normalizeAiPreset(preset) : undefined;
}

export async function fetchAiPresetSlugs(): Promise<string[]> {
  const presets = await fetchAiPresets(defaultLocale);
  return Array.from(new Set(presets.map((preset) => preset.slug).filter(Boolean)));
}

export function buildPresetProvidedDescription(preset: Pick<AiPreset, 'subtitle' | 'meta_description'>): string | null {
  const metaDescription = preset.meta_description?.trim();
  if (metaDescription) {
    return metaDescription.length <= 160 ? metaDescription : `${metaDescription.slice(0, 157).trim()}...`;
  }

  const subtitle = preset.subtitle?.trim();
  if (subtitle) {
    return subtitle.length <= 155 ? subtitle : `${subtitle.slice(0, 152).trim()}...`;
  }

  return null;
}

export function buildPresetDescription(preset: Pick<AiPreset, 'name' | 'subtitle' | 'meta_description'>): string {
  return buildPresetProvidedDescription(preset) || preset.name;
}

export async function generateAiPresetMetadata(slug: string, locale: string): Promise<Metadata> {
  const preset = await fetchAiPreset(slug, locale);
  if (!preset) {
    return {
      title: 'AI Photo Preset',
      description: 'Explore quick AI photo presets from My AI Photo Shoot.',
      robots: { index: false, follow: true },
    };
  }

  const description = buildPresetDescription(preset);
  const title = preset.meta_title?.trim() || `${preset.name} AI Preset | My AI Photo Shoot`;
  const url = canonicalUrl(locale, `/presets/${slug}/`);
  const imageUrl = preset.featured_graphics || 'https://myaiphotoshoot.com/og-image.png';
  const imageAlt = preset.featured_graphics_alt?.trim() || preset.name;

  return {
    title: { absolute: title },
    description,
    alternates: buildAlternates(locale, `/presets/${slug}/`, locales),
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: 'My AI Photo Shoot',
      type: 'website',
      images: [{ url: imageUrl, width: 1200, height: 630, alt: imageAlt }],
      locale: ogLocaleFromAppLocale(locale),
      alternateLocale: ogAlternateLocales(locales, locale),
    },
    twitter: { card: 'summary_large_image', title, description, images: [imageUrl] },
  };
}
