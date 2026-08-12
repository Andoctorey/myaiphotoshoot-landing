import type { Metadata } from 'next';
import { defaultLocale, locales } from '@/i18n/request';
import { fetchMasksCatalogStrict } from '@/lib/ai-masks';
import { normalizePublishedMaskCategoryLandings } from '@/lib/ai-mask-landing-validation';
import { postPublicSupabaseRpc } from '@/lib/public-supabase';
import {
  buildMetaDescription,
  canonicalUrl,
  ogAlternateLocales,
  ogLocaleFromAppLocale,
} from '@/lib/seo';
import type { AiMaskCategoryLanding } from '@/types/ai-mask';

const MASK_LANDINGS_REVALIDATE_SECONDS = 3600;
const MASK_LANDINGS_RPC = 'list_published_ai_mask_category_landings';
let missingRpcLogged = false;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isMissingRpcResponse(status: number, body: unknown): boolean {
  if (status !== 404) return false;
  return !isRecord(body) || body.code === 'PGRST202';
}

function logMissingRpc(body: unknown): void {
  if (missingRpcLogged) return;
  missingRpcLogged = true;
  const code = isRecord(body) && typeof body.code === 'string' ? ` (${body.code})` : '';
  console.warn(
    `Published mask category landing RPC is not available yet${code}; published landing content and sitemap entries will be omitted.`,
  );
}

export async function fetchPublishedMaskCategoryLandings(
  locale: string | null = null,
): Promise<AiMaskCategoryLanding[]> {
  if (locale !== null && !locales.includes(locale as (typeof locales)[number])) {
    throw new Error(`Cannot fetch mask category landings for unsupported locale "${locale}".`);
  }

  try {
    const response = await postPublicSupabaseRpc(
      MASK_LANDINGS_RPC,
      { p_locale: locale },
      MASK_LANDINGS_REVALIDATE_SECONDS,
    );
    const responseText = await response.text();
    let body: unknown;
    try {
      body = JSON.parse(responseText);
    } catch {
      if (response.status === 404) {
        logMissingRpc(undefined);
        return [];
      }
      throw new Error('RPC response was not valid JSON.');
    }
    if (!response.ok) {
      if (isMissingRpcResponse(response.status, body)) {
        logMissingRpc(body);
        return [];
      }
      const code = isRecord(body) && typeof body.code === 'string' ? ` (${body.code})` : '';
      throw new Error(`RPC returned HTTP ${response.status}${code}.`);
    }

    const landings = normalizePublishedMaskCategoryLandings(body, locales);
    if (locale !== null && landings.some((landing) => landing.locale !== locale)) {
      throw new Error(`RPC returned a different locale while filtering for "${locale}".`);
    }
    return landings;
  } catch (error) {
    throw new Error(
      `Failed to fetch published AI mask category landings for locale "${locale ?? 'all'}".`,
      { cause: error },
    );
  }
}

export function findPublishedMaskCategoryLanding(
  landings: readonly AiMaskCategoryLanding[],
  slug: string,
  locale: string,
): AiMaskCategoryLanding | undefined {
  return landings.find((landing) => landing.slug === slug && landing.locale === locale);
}

export function publishedMaskCategorySiblings(
  landings: readonly AiMaskCategoryLanding[],
  categoryId: string,
): AiMaskCategoryLanding[] {
  return landings.filter((landing) => landing.categoryId === categoryId);
}

export function buildPublishedMaskCategoryLanguages(
  landings: readonly AiMaskCategoryLanding[],
  categoryId: string,
): Record<string, string> {
  const siblings = publishedMaskCategorySiblings(landings, categoryId);
  const languages = Object.fromEntries(siblings.map((landing) => [
    landing.locale,
    canonicalUrl(landing.locale, `/masks/${landing.slug}/`),
  ]));
  const english = siblings.find((landing) => landing.locale === defaultLocale);
  if (english) {
    languages['x-default'] = canonicalUrl(defaultLocale, `/masks/${english.slug}/`);
  }
  return languages;
}

export async function generateMaskCategoryLandingMetadata(
  slug: string,
  locale: string,
): Promise<Metadata> {
  const landings = await fetchPublishedMaskCategoryLandings();
  const landing = findPublishedMaskCategoryLanding(landings, slug, locale);
  if (!landing) {
    return {
      title: 'AI Mask Category',
      description: 'Explore AI Masks from My AI Photo Shoot.',
      robots: { index: false, follow: false },
    };
  }

  const catalog = await fetchMasksCatalogStrict(locale);
  const category = catalog.categories.find((item) => item.id === landing.categoryId);
  const firstMask = catalog.masks.find((mask) => mask.categoryId === landing.categoryId);
  if (!category || !firstMask) {
    return {
      title: { absolute: landing.title },
      description: buildMetaDescription(landing.description, landing.introduction),
      robots: { index: false, follow: false },
    };
  }
  const imageUrl = firstMask.featuredGraphics || category.sourceImageUrl || '/og-image-v2.jpg?v=4';
  const description = buildMetaDescription(landing.description, landing.introduction);
  const path = `/masks/${landing.slug}/`;
  const url = canonicalUrl(locale, path);
  const siblingLocales = publishedMaskCategorySiblings(landings, landing.categoryId)
    .map((item) => item.locale);

  return {
    title: { absolute: landing.title },
    description,
    alternates: {
      canonical: url,
      languages: buildPublishedMaskCategoryLanguages(landings, landing.categoryId),
    },
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
      title: landing.title,
      description,
      url,
      siteName: 'My AI Photo Shoot',
      type: 'website',
      images: [{ url: imageUrl, alt: firstMask.name || category.name || landing.title }],
      locale: ogLocaleFromAppLocale(locale),
      alternateLocale: ogAlternateLocales(siblingLocales, locale),
    },
    twitter: {
      card: 'summary_large_image',
      title: landing.title,
      description,
      images: [{ url: imageUrl, alt: firstMask.name || category.name || landing.title }],
    },
  };
}
