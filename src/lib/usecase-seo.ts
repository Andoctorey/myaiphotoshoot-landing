import type { Metadata } from 'next';
import { env } from '@/lib/env';
import { buildAlternates, canonicalUrl, ogAlternateLocales, ogLocaleFromAppLocale } from '@/lib/seo';
import { defaultLocale, locales } from '@/i18n/request';
import type { UseCase } from '@/types/usecase';

const USE_CASE_REVALIDATE_SECONDS = 3600;

export function buildUseCaseUrl(slug: string, locale: string): string {
  const searchParams = new URLSearchParams({ slug, locale });
  return `${env.SUPABASE_FUNCTIONS_URL}/use-case?${searchParams.toString()}`;
}

export async function fetchUseCase(slug: string, locale: string): Promise<UseCase | undefined> {
  try {
    const res = await fetch(buildUseCaseUrl(slug, locale), {
      next: { revalidate: USE_CASE_REVALIDATE_SECONDS },
    });
    if (!res.ok) {
      return undefined;
    }
    return await res.json() as UseCase;
  } catch {
    return undefined;
  }
}

export async function fetchUseCaseSlugs(): Promise<string[]> {
  try {
    const res = await fetch(
      `${env.SUPABASE_FUNCTIONS_URL}/use-cases?page=1&limit=100&locale=${defaultLocale}`,
      { next: { revalidate: USE_CASE_REVALIDATE_SECONDS } },
    );
    if (!res.ok) return [];
    const data = await res.json();
    const items = (data.items || []).filter((it: { slug?: string }) => Boolean(it.slug));
    return Array.from(new Set(items.map((it: { slug: string }) => it.slug)));
  } catch {
    return [];
  }
}

export async function generateUseCaseMetadata(slug: string, locale: string): Promise<Metadata> {
  const uc = await fetchUseCase(slug, locale);
  if (!uc) {
    return { title: 'AI Photo Use Case', description: 'AI portrait examples and use cases from My AI Photo Shoot.' };
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
