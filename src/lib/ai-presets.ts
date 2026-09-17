import type { Metadata } from 'next';
import { defaultLocale, locales } from '@/i18n/request';
import {
  AI_PRESET_REVALIDATE_SECONDS,
  readAiPresetBuildSnapshot,
  storeAiPresetBuildSnapshot,
} from '@/lib/ai-preset-build-cache';
import {
  AI_PRESETS_PAGE_SIZE,
  type AiPresetsPage,
} from '@/lib/ai-presets-shared';
import { CREDIT_USD_REFERENCE_VALUE } from '@/lib/pricing';
import { postPublicSupabaseRpc } from '@/lib/public-supabase';
import { buildAlternates, canonicalUrl, ogAlternateLocales, ogLocaleFromAppLocale } from '@/lib/seo';
import type { AiPreset, AiPresetFaq, AiPresetSeoSection } from '@/types/ai-preset';

export { AI_PRESETS_PAGE_SIZE, aiPresetsPagePath } from '@/lib/ai-presets-shared';
export type { AiPresetsPage } from '@/lib/ai-presets-shared';
const AI_PRESETS_MAX_PAGE_SIZE = 100;
export const AI_PRESETS_INDEX_TITLE = 'AI Photo Presets | My AI Photoshoot';
export const AI_PRESETS_INDEX_DESCRIPTION =
  'Browse quick AI photo presets for fun looks and shareable photo transformations.';

export function buildPresetAppUrl(slug: string): string {
  return `https://app.myaiphotoshoot.com/#preset/${encodeURIComponent(slug)}`;
}

function emptyAiPresetsPage(page: number, pageSize: number): AiPresetsPage {
  return {
    presets: [],
    totalCount: 0,
    page,
    pageSize,
    totalPages: 1,
    hasPreviousPage: page > 1,
    hasNextPage: false,
  };
}

function isAiPresetRow(item: unknown): item is AiPreset {
  if (!item || typeof item !== 'object') return false;
  const record = item as Record<string, unknown>;
  return typeof record.id === 'string'
    && typeof record.slug === 'string'
    && typeof record.name === 'string';
}

function normalizePositiveInteger(value: number, fallback: number): number {
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

async function readAiPresetsPageFromBuildSnapshot(
  locale: string,
  page: number,
  pageSize: number,
): Promise<AiPresetsPage | null> {
  if (process.env.NODE_ENV !== 'production') return null;

  const presets = await readAiPresetBuildSnapshot(locale);
  if (!presets) return null;

  const normalizedPage = normalizePositiveInteger(page, 1);
  const normalizedPageSize = Math.min(
    normalizePositiveInteger(pageSize, AI_PRESETS_PAGE_SIZE),
    AI_PRESETS_MAX_PAGE_SIZE,
  );
  const totalCount = presets.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / normalizedPageSize));
  const offset = (normalizedPage - 1) * normalizedPageSize;
  return {
    presets: presets.slice(offset, offset + normalizedPageSize),
    totalCount,
    page: normalizedPage,
    pageSize: normalizedPageSize,
    totalPages,
    hasPreviousPage: normalizedPage > 1,
    hasNextPage: normalizedPage < totalPages,
  };
}

async function postAiPresetsRpc(body: Record<string, unknown>): Promise<Response> {
  // public.list_ai_presets is defined in myaiphotoshoot-functions migrations; update
  // src/types/ai-preset.ts and admin/src/lib/presetService.ts when its output changes.
  return postPublicSupabaseRpc('list_ai_presets', body, AI_PRESET_REVALIDATE_SECONDS);
}

async function postAiPresetLookupRpc(slug: string, locale: string): Promise<Response> {
  return postPublicSupabaseRpc('get_ai_preset_page', {
    p_slug: slug,
    p_locale: locale,
  }, AI_PRESET_REVALIDATE_SECONDS);
}

async function postAiPresetPriceLookupRpc(slug: string, locale: string): Promise<Response> {
  return postPublicSupabaseRpc('get_ai_preset', {
    p_identifier: slug,
    p_locale: locale,
  }, AI_PRESET_REVALIDATE_SECONDS);
}

async function fetchAiPresetCreditCost(
  slug: string,
  locale: string,
  expectedPreset: Pick<AiPreset, 'id' | 'slug'>,
): Promise<number> {
  const response = await postAiPresetPriceLookupRpc(slug, locale);
  if (!response.ok) {
    throw new Error(`Preset price lookup RPC returned ${response.status}.`);
  }
  const data: unknown = await response.json();
  if (!Array.isArray(data) || data.length !== 1) {
    throw new Error('Preset price lookup RPC response was not a single preset.');
  }
  const pricedPreset = data[0];
  if (
    !isAiPresetRow(pricedPreset)
    || pricedPreset.id !== expectedPreset.id
    || pricedPreset.slug !== expectedPreset.slug
  ) {
    throw new Error('Preset price lookup RPC returned a different preset.');
  }
  const costCredits = normalizeCreditCost(pricedPreset.cost_credits);
  if (costCredits === null) {
    throw new Error('Preset price lookup RPC response omitted cost_credits.');
  }
  return costCredits;
}

async function fetchAiPresetsPageInternal(
  locale: string,
  page: number,
  pageSize: number,
  strict: boolean,
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
    const paginatedStatus = res.status;
    let usedLegacyRpc = false;

    if (!res.ok) {
      res = await postAiPresetsRpc({ p_locale: locale });
      usedLegacyRpc = true;
      if (!res.ok) {
        if (strict) {
          throw new Error(
            `Paginated RPC returned ${paginatedStatus} and legacy RPC returned ${res.status}.`,
          );
        }
        return emptyAiPresetsPage(normalizedPage, normalizedPageSize);
      }
    }

    const data: unknown = await res.json();
    if (!Array.isArray(data)) {
      if (strict) {
        throw new Error('Preset RPC response was not an array.');
      }
      return emptyAiPresetsPage(normalizedPage, normalizedPageSize);
    }
    if (strict && data.some((item) => {
      if (!isAiPresetRow(item)) return true;
      return !item.id.trim() || !item.slug.trim() || !item.name.trim();
    })) {
      throw new Error('Preset RPC response contained an invalid route record.');
    }

    const allRows = data.filter(isAiPresetRow).map(normalizeAiPreset);
    if (strict && normalizedPage === 1 && allRows.length === 0) {
      throw new Error('Preset RPC response contained no published presets.');
    }
    const presets = usedLegacyRpc
      ? allRows.slice(offset, offset + normalizedPageSize)
      : allRows;
    if (!usedLegacyRpc && normalizedPage > 1 && presets.length === 0) {
      const firstPage = await fetchAiPresetsPageInternal(locale, 1, normalizedPageSize, strict);
      if (strict && normalizedPage <= firstPage.totalPages) {
        throw new Error(`Preset RPC returned an empty page ${normalizedPage} of ${firstPage.totalPages}.`);
      }
      return {
        ...firstPage,
        presets: [],
        page: normalizedPage,
        hasPreviousPage: true,
        hasNextPage: false,
      };
    }

    const reportedTotalCount = presets[0]?.total_count;
    const hasValidReportedTotalCount = typeof reportedTotalCount === 'number'
      && Number.isInteger(reportedTotalCount)
      && reportedTotalCount >= offset + presets.length;
    if (strict && !usedLegacyRpc && (
      !hasValidReportedTotalCount
      || presets.some((preset) => preset.total_count !== reportedTotalCount)
    )) {
      throw new Error('Paginated preset RPC response contained an invalid or inconsistent total_count.');
    }

    const totalCount = usedLegacyRpc
      ? allRows.length
      : hasValidReportedTotalCount
        ? reportedTotalCount
        : normalizedPage === 1
          ? presets.length
          : offset + presets.length;
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
  } catch (error) {
    if (strict) {
      throw new Error(`Failed to fetch AI presets for locale "${locale}", page ${normalizedPage}.`, {
        cause: error,
      });
    }
    return emptyAiPresetsPage(normalizedPage, normalizedPageSize);
  }
}

export async function fetchAiPresetsPage(
  locale: string = defaultLocale,
  page: number = 1,
  pageSize: number = AI_PRESETS_PAGE_SIZE,
): Promise<AiPresetsPage> {
  const cached = await readAiPresetsPageFromBuildSnapshot(locale, page, pageSize);
  if (cached) return cached;
  return fetchAiPresetsPageInternal(locale, page, pageSize, false);
}

export async function fetchAiPresetsPageStrict(
  locale: string = defaultLocale,
  page: number = 1,
  pageSize: number = AI_PRESETS_PAGE_SIZE,
): Promise<AiPresetsPage> {
  const cached = await readAiPresetsPageFromBuildSnapshot(locale, page, pageSize);
  if (cached) return cached;
  return fetchAiPresetsPageInternal(locale, page, pageSize, true);
}

async function fetchAiPresetsInternal(locale: string, strict: boolean): Promise<AiPreset[]> {
  const presets: AiPreset[] = [];
  let page = 1;
  let hasNextPage = true;
  let expectedTotalCount: number | null = null;

  while (hasNextPage) {
    const result = await fetchAiPresetsPageInternal(locale, page, AI_PRESETS_MAX_PAGE_SIZE, strict);
    if (page === 1) {
      expectedTotalCount = result.totalCount;
    } else if (strict && result.totalCount !== expectedTotalCount) {
      throw new Error(
        `AI preset total changed from ${expectedTotalCount} to ${result.totalCount} while fetching locale "${locale}".`,
      );
    }
    presets.push(...result.presets);
    hasNextPage = result.hasNextPage && result.presets.length > 0;
    page += 1;
  }

  if (strict && expectedTotalCount !== null && presets.length !== expectedTotalCount) {
    throw new Error(`Expected ${expectedTotalCount} AI presets for locale "${locale}", received ${presets.length}.`);
  }

  return presets;
}

export async function fetchAiPresets(locale: string = defaultLocale): Promise<AiPreset[]> {
  if (process.env.NODE_ENV === 'production') {
    const cached = await readAiPresetBuildSnapshot(locale);
    if (cached) return cached;
  }
  return fetchAiPresetsInternal(locale, false);
}

export async function fetchAiPresetsStrict(locale: string = defaultLocale): Promise<AiPreset[]> {
  if (process.env.NODE_ENV === 'production') {
    const cached = await readAiPresetBuildSnapshot(locale);
    if (cached) return cached;
  }
  return fetchAiPresetsInternal(locale, true);
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

function normalizeCreditCost(value: unknown): number | null {
  const normalized = typeof value === 'string' && value.trim()
    ? Number(value)
    : value;
  return typeof normalized === 'number'
    && Number.isSafeInteger(normalized)
    && normalized > 0
    ? normalized
    : null;
}

function deriveCreditCostFromUsd(costUsd: number | null): number | null {
  if (costUsd === null || costUsd <= 0) return null;
  return normalizeCreditCost(Math.ceil(costUsd / CREDIT_USD_REFERENCE_VALUE));
}

export function normalizeAiPreset(preset: AiPreset): AiPreset {
  const cost = normalizeCost(preset.cost);
  return {
    ...preset,
    cost,
    cost_credits: normalizeCreditCost(preset.cost_credits)
      ?? deriveCreditCostFromUsd(cost),
    seo_sections: normalizeSeoSections(preset.seo_sections),
    faqs: normalizeFaqs(preset.faqs),
  };
}

const pendingBuildSnapshots = new Map<string, Promise<Map<string, AiPreset[]>>>();

async function prepareAiPresetBuildSnapshots(
  requestedLocales: readonly string[],
): Promise<Map<string, AiPreset[]>> {
  const snapshotLocales = Array.from(new Set(requestedLocales));
  const requestKey = snapshotLocales.slice().sort().join(',');
  const pending = pendingBuildSnapshots.get(requestKey);
  if (pending) return pending;

  const request = (async () => {
    const entries: Array<readonly [string, AiPreset[]]> = [];
    for (const locale of snapshotLocales) {
      entries.push([locale, await fetchAiPresetsInternal(locale, true)] as const);
    }
    const snapshots = new Map(entries);
    const defaultPresets = snapshots.get(defaultLocale);
    if (!defaultPresets) {
      throw new Error(`AI preset build snapshot omitted the default locale "${defaultLocale}".`);
    }

    const defaultSlugs = new Set(defaultPresets.map((preset) => preset.slug));
    for (const [locale, presets] of entries) {
      const localeSlugs = new Set(presets.map((preset) => preset.slug));
      if (
        localeSlugs.size !== defaultSlugs.size
        || Array.from(defaultSlugs).some((slug) => !localeSlugs.has(slug))
      ) {
        throw new Error(`AI preset route inventory for locale "${locale}" does not match English.`);
      }
    }

    const cacheResults = await Promise.all(entries.map(([locale, presets]) => (
      storeAiPresetBuildSnapshot(locale, presets)
    )));
    const reusedCount = cacheResults.filter((result) => result === 'reused').length;
    console.log(
      `Prepared AI preset build snapshots for ${entries.length} locales `
        + `(${reusedCount} reused, ${entries.length - reusedCount} refreshed).`,
    );
    return snapshots;
  })();

  pendingBuildSnapshots.set(requestKey, request);
  void request.catch(() => {
    pendingBuildSnapshots.delete(requestKey);
  });
  return request;
}

export async function fetchAiPreset(slug: string, locale: string): Promise<AiPreset | undefined> {
  if (process.env.NODE_ENV === 'production') {
    const snapshot = await readAiPresetBuildSnapshot(locale);
    if (snapshot) {
      return snapshot.find((preset) => preset.slug === slug);
    }
  }

  try {
    const res = await postAiPresetLookupRpc(slug, locale);
    if (!res.ok) {
      throw new Error(`Preset lookup RPC returned ${res.status}.`);
    }

    const data: unknown = await res.json();
    if (!Array.isArray(data) || data.length > 1) {
      throw new Error('Preset lookup RPC response was not a valid preset array.');
    }

    const preset = data[0];
    if (!preset) return undefined;
    if (
      !isAiPresetRow(preset)
      || !preset.id.trim()
      || preset.slug !== slug
      || !preset.name.trim()
    ) {
      throw new Error('Preset lookup RPC response contained an invalid route record.');
    }
    const normalizedPreset = normalizeAiPreset(preset);
    if (normalizedPreset.cost_credits != null) {
      return normalizedPreset;
    }

    // Keep the legacy lookup for partially deployed or rolled-back environments.
    return {
      ...normalizedPreset,
      cost_credits: await fetchAiPresetCreditCost(slug, locale, normalizedPreset),
    };
  } catch (error) {
    throw new Error(`Failed to fetch AI preset "${slug}" for locale "${locale}".`, {
      cause: error,
    });
  }
}

export async function fetchAiPresetCount(): Promise<number> {
  return (await fetchAiPresetsPageStrict(defaultLocale, 1, 1)).totalCount;
}

export async function fetchAiPresetSlugs(
  snapshotLocales: readonly string[] = locales,
): Promise<string[]> {
  const presets = process.env.NODE_ENV === 'production'
    ? (await prepareAiPresetBuildSnapshots(snapshotLocales)).get(defaultLocale) ?? []
    : await fetchAiPresetsStrict(defaultLocale);
  const slugs = presets.map((preset) => preset.slug.trim());
  const uniqueSlugs = Array.from(new Set(slugs));
  if (uniqueSlugs.length !== presets.length) {
    throw new Error('AI preset route inventory contained duplicate slugs.');
  }
  return uniqueSlugs;
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
      description: 'Explore quick AI photo presets from My AI Photoshoot.',
      robots: { index: false, follow: true },
    };
  }

  const description = buildPresetDescription(preset);
  const title = preset.meta_title?.trim() || `${preset.name} AI Preset | My AI Photoshoot`;
  const url = canonicalUrl(locale, `/presets/${slug}/`);
  const imageUrl = preset.featured_graphics || 'https://myaiphotoshoot.com/og-image-v2.jpg?v=8';
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
      siteName: 'My AI Photoshoot',
      type: 'website',
      images: [{ url: imageUrl, alt: imageAlt }],
      locale: ogLocaleFromAppLocale(locale),
      alternateLocale: ogAlternateLocales(locales, locale),
    },
    twitter: { card: 'summary_large_image', title, description, images: [{ url: imageUrl, alt: imageAlt }] },
  };
}
