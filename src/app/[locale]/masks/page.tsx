import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import AiMasksCatalog from '@/components/masks/AiMasksCatalog';
import { locales } from '@/i18n/request';
import { fetchMasksCatalogStrict } from '@/lib/ai-masks';
import { fetchPublishedMaskCategoryLandings } from '@/lib/ai-mask-landings';
import {
  buildAlternates,
  canonicalUrl,
  ogAlternateLocales,
  ogLocaleFromAppLocale,
} from '@/lib/seo';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const [t, catalog] = await Promise.all([
    getTranslations({ locale, namespace: 'masks' }),
    fetchMasksCatalogStrict(locale),
  ]);
  const title = `${t('title')} | My AI Photo Shoot`;
  const description = t('description');
  const imageUrl = catalog.masks[0]?.featuredGraphics;

  return {
    title: { absolute: title },
    description,
    alternates: buildAlternates(locale, '/masks/', locales),
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
      url: canonicalUrl(locale, '/masks/'),
      siteName: 'My AI Photo Shoot',
      type: 'website',
      images: imageUrl ? [{ url: imageUrl, alt: t('resultAlt', { name: catalog.masks[0].name }) }] : undefined,
      locale: ogLocaleFromAppLocale(locale),
      alternateLocale: ogAlternateLocales(locales, locale),
    },
    twitter: { card: 'summary_large_image', title, description, images: imageUrl ? [imageUrl] : undefined },
  };
}

export default async function MasksPage({ params }: PageProps) {
  const { locale } = await params;
  const [catalog, landings] = await Promise.all([
    fetchMasksCatalogStrict(locale),
    fetchPublishedMaskCategoryLandings(locale),
  ]);
  return (
    <AiMasksCatalog
      locale={locale}
      catalog={catalog}
      publishedCategoryIds={landings.map((landing) => landing.categoryId)}
    />
  );
}
