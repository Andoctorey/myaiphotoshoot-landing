import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { env } from '@/lib/env';
import { buildAlternates, canonicalUrl, ogAlternateLocales, ogLocaleFromAppLocale } from '@/lib/seo';
import { locales } from '@/i18n/request';
import type { UseCase } from '@/types/usecase';

const USE_CASE_REVALIDATE_SECONDS = 3600;
const MAX_USE_CASE_TITLE_LENGTH = 65;
const MAX_USE_CASE_DESCRIPTION_LENGTH = 160;
const SITE_TITLE_SUFFIX = ' | My AI Photo Shoot';
const STALE_DOLLAR_PRICE_PATTERN_SOURCE = String.raw`(?:\$(?:2\.99|4\.99|5\.99|9\.99|0\.03|0\.09|0\.19|0\.29)(?!\d)|(?:2,99|4,99|5,99|9,99|0,03|0,09|0,19|0,29)\s*\$)`;
const STALE_DOLLAR_PRICE_PATTERN = new RegExp(STALE_DOLLAR_PRICE_PATTERN_SOURCE, 'i');
const STALE_PRICE_CLAIM_PATTERN = new RegExp(
  String.raw`(?:\b(?:from|starting(?:\s+at)?|starts?\s+at|for|only|costs?|priced?\s+at)\s*)?${STALE_DOLLAR_PRICE_PATTERN_SOURCE}(?:\s*(?:each|per\s+(?:photo|image|model|generation)))?`,
  'gi'
);
const NO_SUBSCRIPTION_REQUIRED_PATTERN = /(?:\b(?:with\s+)?no subscription required\b|\bsin suscripci[oó]n(?: obligatoria| requerida)?\b|\bkein(?:e|es)? abonnement erforderlich\b|\baucun abonnement (?:n['’]est )?requis\b|\bподписка не требуется\b|无需订阅|サブスクリプション不要|सदस्यता की आवश्यकता नहीं|لا يلزم اشتراك)/giu;
const SOCIAL_COMMERCIAL_CLAIM_PATTERN = /(?:[$€£¥₹₽]\s*\d|\d+\s*cr\b|\b(?:credits?|pro|max|subscriptions?|subs?|pay[\s-]*as[\s-]*you[\s-]*go|plans?|pricing|prices?|resolution|[1248]k)\b|cr[eé]dit(?:s|os)?|kredit(?:e|en|s)?|abonnement|suscripci[oó]n|forfait|tarif|кредит|подписк|тариф|积分|订阅|套餐|クレジット|サブスクリプション|プラン|क्रेडिट|सदस्यता|प्लान|أرصدة|رصيد|اشتراك|خطة|الدقة|auflösung|r[ée]solution|resoluci[oó]n|разрешени|分辨率|画质|解像度|रिज़ॉल्यूशन)/iu;
const PRICE_BASED_TITLE_SUFFIX_PATTERN = new RegExp(
  String.raw`\s*(?:[|–—-]\s*)?(?:(?:from|starting(?:\s+at)?|starts?\s+at|only)\s*)?${STALE_DOLLAR_PRICE_PATTERN_SOURCE}(?:\s*(?:each|per\s+(?:photo|image|model|generation)))?(?:\s*[|–—-]\s*My AI Photo Shoot)?\s*$`,
  'i'
);

export interface UseCaseInventoryItem {
  slug: string;
  created_at?: string;
  featured_image_urls?: string[] | null;
}

export function buildUseCaseUrl(slug: string, locale: string): string {
  const searchParams = new URLSearchParams({ slug, locale, platform: 'web' });
  return `${env.SUPABASE_FUNCTIONS_URL}/use-case?${searchParams.toString()}`;
}

export async function fetchUseCase(slug: string, locale: string): Promise<UseCase | undefined> {
  const url = buildUseCaseUrl(slug, locale);

  try {
    const res = await fetch(url, {
      next: { revalidate: USE_CASE_REVALIDATE_SECONDS },
    });

    if (res.status === 404) {
      const data: unknown = await res.json();
      const message = data && typeof data === 'object'
        ? (data as { error?: unknown }).error
        : undefined;
      if (typeof message === 'string' && message.trim() === 'Not found') {
        return undefined;
      }
      throw new Error('Use-case endpoint returned an unexpected 404 response.');
    }
    if (!res.ok) {
      throw new Error(`Request failed with status ${res.status}.`);
    }

    const data: unknown = await res.json();
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('Response did not contain a use-case object.');
    }

    return data as UseCase;
  } catch (error) {
    throw new Error(`Failed to fetch use case "${slug}" for locale "${locale}" from ${url}.`, {
      cause: error,
    });
  }
}

export async function fetchUseCaseInventory(): Promise<UseCaseInventoryItem[]> {
  const url = `${env.SUPABASE_FUNCTIONS_URL}/use-cases?sitemap=1`;

  try {
    const res = await fetch(url, { next: { revalidate: USE_CASE_REVALIDATE_SECONDS } });
    if (!res.ok) {
      throw new Error(`Request failed with status ${res.status}.`);
    }

    const data: unknown = await res.json();
    const items = (data as { items?: unknown })?.items;
    if (!Array.isArray(items)) {
      throw new Error('Response did not contain an items array.');
    }

    const inventory = items.map((item, index): UseCaseInventoryItem => {
      if (!item || typeof item !== 'object') {
        throw new Error(`Response item ${index} was not an object.`);
      }
      const slug = (item as { slug?: unknown }).slug;
      if (typeof slug !== 'string' || !slug.trim()) {
        throw new Error(`Response item ${index} did not contain a valid use-case slug.`);
      }
      return { ...(item as UseCaseInventoryItem), slug: slug.trim() };
    });
    if (inventory.length === 0) {
      throw new Error('Response contained no published use cases.');
    }
    if (new Set(inventory.map((item) => item.slug)).size !== inventory.length) {
      throw new Error('Response contained duplicate use-case slugs.');
    }

    return inventory;
  } catch (error) {
    throw new Error(`Failed to fetch the use-case route inventory from ${url}.`, {
      cause: error,
    });
  }
}

export async function fetchUseCaseSlugs(): Promise<string[]> {
  const inventory = await fetchUseCaseInventory();
  return inventory.map((item) => item.slug);
}

export async function generateUseCaseMetadata(slug: string, locale: string): Promise<Metadata> {
  const uc = await fetchUseCase(slug, locale);
  if (!uc) {
    return {
      title: 'AI Photo Use Case',
      description: 'AI portrait examples and use cases from My AI Photo Shoot.',
      robots: { index: false, follow: false },
    };
  }
  const [tUseCase, tHome] = await Promise.all([
    getTranslations({ locale, namespace: 'useCase' }),
    getTranslations({ locale, namespace: 'pageCopy.home' }),
  ]);

  const baseTitle = normalizeUseCaseTitle(String(uc.meta_title || uc.title || ''));
  const title = buildUseCaseTitle(baseTitle);

  const rawDescription = String(uc.meta_description || uc.title || '');
  const normalizedDescription = normalizeUseCaseDescription(rawDescription)
    || normalizeUseCaseTitle(String(uc.title || ''));
  const description = appendPlanSummary(
    normalizedDescription,
    tUseCase('offerSummary')
  );
  const socialDescription = buildUseCaseSocialDescription(
    normalizedDescription,
    tHome('shareDescription')
  );

  const url = canonicalUrl(locale, `/use-cases/${slug}/`);
  const imageUrl = (Array.isArray(uc.featured_image_urls) && uc.featured_image_urls[0])
    || '/og-image-v2.jpg?v=4';

  return {
    title: { absolute: title || 'Use Case | My AI Photo Shoot' },
    description,
    alternates: buildAlternates(locale, `/use-cases/${slug}/`, locales),
    openGraph: {
      title,
      description: socialDescription,
      url,
      siteName: 'My AI Photo Shoot',
      type: 'website',
      images: [{ url: imageUrl, alt: uc.title || title }],
      locale: ogLocaleFromAppLocale(locale),
      alternateLocale: ogAlternateLocales(locales, locale),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: socialDescription,
      images: [{ url: imageUrl, alt: uc.title || title }],
    },
  };
}

function buildUseCaseSocialDescription(description: string, fallback: string): string {
  const sentences = description
    .match(/[^!?。！？]*?(?:[!?。！？]+|\.(?=\s|$)|$)/gu)
    ?.map((sentence) => sentence.trim())
    .filter(Boolean) || [];
  const evergreenDescription = tidyMetaText(
    sentences
      .filter((sentence) => !SOCIAL_COMMERCIAL_CLAIM_PATTERN.test(sentence))
      .join(' ')
  );
  return truncateAtWord(
    evergreenDescription || tidyMetaText(fallback),
    MAX_USE_CASE_DESCRIPTION_LENGTH
  );
}

function normalizeUseCaseTitle(value: string): string {
  return tidyMetaText(
    value
      .trim()
      .replace(PRICE_BASED_TITLE_SUFFIX_PATTERN, '')
      .replace(STALE_PRICE_CLAIM_PATTERN, '')
      .replace(NO_SUBSCRIPTION_REQUIRED_PATTERN, '')
  );
}

function normalizeUseCaseDescription(value: string): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized) return '';

  const sentences = normalized
    .match(/[^!?。！？]*?(?:[!?。！？]+|\.(?=\s|$)|$)/gu)
    ?.map((sentence) => sentence.trim())
    .filter(Boolean) || [];
  const withoutStaleClaims = sentences
    .filter((sentence) => !STALE_DOLLAR_PRICE_PATTERN.test(sentence))
    .map((sentence) => sentence.replace(NO_SUBSCRIPTION_REQUIRED_PATTERN, ''))
    .map(tidyMetaText)
    .filter(Boolean);

  return tidyMetaText(withoutStaleClaims.join(' '));
}

function appendPlanSummary(description: string, planSummary: string): string {
  const base = tidyMetaText(description);
  const summary = tidyMetaText(planSummary);
  if (!summary) return base;
  if (alreadyDescribesPlans(base)) return base;

  const separator = !base
    ? ''
    : /[.!?。！？]$/u.test(base)
      ? ' '
      : '. ';
  const candidate = `${base}${separator}${summary}`;
  return candidate.length <= MAX_USE_CASE_DESCRIPTION_LENGTH ? candidate : base;
}

function alreadyDescribesPlans(value: string): boolean {
  return /\bPro\b/i.test(value)
    && /\bMax\b/i.test(value)
    && /\b(?:1K|2K|4K)\b/i.test(value);
}

function buildUseCaseTitle(baseTitle: string): string {
  const fallbackTitle = 'Use Case | My AI Photo Shoot';
  if (!baseTitle) return fallbackTitle;

  const alreadyBranded = /(?:\||[-–—])\s*My AI Photo Shoot$/i.test(baseTitle);
  const brandedCandidate = alreadyBranded
    ? baseTitle
    : `${baseTitle}${SITE_TITLE_SUFFIX}`;
  const preferredTitle = brandedCandidate.length <= MAX_USE_CASE_TITLE_LENGTH
    ? brandedCandidate
    : baseTitle;
  return truncateAtWord(preferredTitle, MAX_USE_CASE_TITLE_LENGTH);
}

function truncateAtWord(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;

  const availableLength = maxLength - 1;
  const candidate = value.slice(0, availableLength + 1);
  const lastSpace = candidate.lastIndexOf(' ');
  const cutoff = lastSpace >= Math.floor(availableLength * 0.6)
    ? lastSpace
    : availableLength;
  return `${candidate.slice(0, cutoff).trimEnd()}…`;
}

function tidyMetaText(value: string): string {
  const tidied = value
    .replace(/\(\s*\)/g, '')
    .replace(/\s+([,.;:!?。！？])/g, '$1')
    .replace(/,\s*([.!?。！？])/g, '$1')
    .replace(/\s*([|•·])\s*(?=$|[.!?。！？])/g, '')
    .replace(/^[\s,;:|•·–—-]+|[\s,;:|•·–—-]+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return /[\p{L}\p{N}]/u.test(tidied) ? tidied : '';
}
