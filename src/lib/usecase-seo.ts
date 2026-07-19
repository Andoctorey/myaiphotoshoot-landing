import type { Metadata } from 'next';
import { env } from '@/lib/env';
import { buildAlternates, canonicalUrl, ogAlternateLocales, ogLocaleFromAppLocale } from '@/lib/seo';
import { locales } from '@/i18n/request';
import type { UseCase } from '@/types/usecase';

const USE_CASE_REVALIDATE_SECONDS = 3600;

export interface UseCaseInventoryItem {
  slug: string;
  created_at?: string;
  featured_image_urls?: string[] | null;
}

export function buildUseCaseUrl(slug: string, locale: string): string {
  const searchParams = new URLSearchParams({ slug, locale });
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

  const baseTitle = replaceLegacyTrainingPrice(String(uc.meta_title || uc.title || '').trim());
  const siteSuffix = ' | My AI Photo Shoot';
  const pricedSuffix = ' | From $5.99 - My AI Photo Shoot';
  let title = baseTitle;
  if (baseTitle) {
    const pricedCandidate = `${baseTitle}${pricedSuffix}`;
    const siteCandidate = `${baseTitle}${siteSuffix}`;
    if (pricedCandidate.length <= 65) {
      title = pricedCandidate;
    } else if (siteCandidate.length <= 65) {
      title = siteCandidate;
    }
  }

  const baseDescription = replaceLegacyTrainingPrice(String(uc.meta_description || uc.title || '').trim());
  const pricingSentence = ' Model training from $5.99, personal-model images $0.03 each. No subscription.';
  let description = baseDescription;
  if (baseDescription) {
    const alreadyHasPricing = /\$5\.99|5,99 \$|No subscription/i.test(baseDescription);
    const withPricing = alreadyHasPricing ? baseDescription : `${baseDescription}${pricingSentence}`;
    description = withPricing.length <= 160 ? withPricing : baseDescription;
  }

  const url = canonicalUrl(locale, `/use-cases/${slug}/`);
  const imageUrl = (Array.isArray(uc.featured_image_urls) && uc.featured_image_urls[0])
    || 'https://myaiphotoshoot.com/og-image.png';

  return {
    title: { absolute: title || 'Use Case | My AI Photo Shoot' },
    description,
    alternates: buildAlternates(locale, `/use-cases/${slug}/`, locales),
    openGraph: {
      title,
      description,
      url,
      siteName: 'My AI Photo Shoot',
      type: 'website',
      images: [{ url: imageUrl, width: 1200, height: 630, alt: uc.title || title }],
      locale: ogLocaleFromAppLocale(locale),
      alternateLocale: ogAlternateLocales(locales, locale),
    },
    twitter: { card: 'summary_large_image', title, description, images: [imageUrl] },
  };
}

function replaceLegacyTrainingPrice(value: string): string {
  return value.replaceAll('$2.99', '$5.99').replaceAll('2,99 $', '5,99 $');
}
