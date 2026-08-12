import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import AiMasksCatalog from '@/components/masks/AiMasksCatalog';
import { defaultLocale, locales } from '@/i18n/request';
import { fetchMasksCatalogStrict } from '@/lib/ai-masks';
import { fetchPublishedMaskCategoryLandings } from '@/lib/ai-mask-landings';
import {
  buildAlternates,
  canonicalUrl,
  ogAlternateLocales,
  ogLocaleFromAppLocale,
} from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const [t, catalog] = await Promise.all([
    getTranslations({ locale: defaultLocale, namespace: 'masks' }),
    fetchMasksCatalogStrict(defaultLocale),
  ]);
  const title = `${t('title')} | My AI Photo Shoot`;
  const description = t('description');
  const imageUrl = catalog.masks[0]?.featuredGraphics;

  return {
    title: { absolute: title },
    description,
    alternates: buildAlternates(defaultLocale, '/masks/', locales),
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
      url: canonicalUrl(defaultLocale, '/masks/'),
      siteName: 'My AI Photo Shoot',
      type: 'website',
      images: imageUrl ? [{ url: imageUrl, alt: t('resultAlt', { name: catalog.masks[0].name }) }] : undefined,
      locale: ogLocaleFromAppLocale(defaultLocale),
      alternateLocale: ogAlternateLocales(locales, defaultLocale),
    },
    twitter: { card: 'summary_large_image', title, description, images: imageUrl ? [imageUrl] : undefined },
  };
}

export default async function MasksPage() {
  const [catalog, landings] = await Promise.all([
    fetchMasksCatalogStrict(defaultLocale),
    fetchPublishedMaskCategoryLandings(defaultLocale),
  ]);
  return (
    <AiMasksCatalog
      locale={defaultLocale}
      catalog={catalog}
      publishedCategoryIds={landings.map((landing) => landing.categoryId)}
    />
  );
}
