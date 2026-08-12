import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import AiMaskCategoryLandingPage from '@/components/masks/AiMaskCategoryLandingPage';
import { defaultLocale, locales } from '@/i18n/request';
import {
  fetchPublishedMaskCategoryLandings,
  findPublishedMaskCategoryLanding,
  generateMaskCategoryLandingMetadata,
} from '@/lib/ai-mask-landings';
import { fetchMasksCatalogStrict } from '@/lib/ai-masks';

type PageProps = { params: Promise<{ locale: string; slug: string }> };

export const dynamicParams = false;

export async function generateStaticParams() {
  const catalog = await fetchMasksCatalogStrict(defaultLocale);
  return locales.flatMap((locale) => catalog.categories.map((category) => ({
    locale,
    slug: category.slug,
  })));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  return generateMaskCategoryLandingMetadata(slug, locale);
}

export default async function LocalizedMaskCategoryPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const [landings, catalog] = await Promise.all([
    fetchPublishedMaskCategoryLandings(locale),
    fetchMasksCatalogStrict(locale),
  ]);
  const landing = findPublishedMaskCategoryLanding(landings, slug, locale);
  if (!landing) notFound();
  const categoryExists = catalog.categories.some((category) => category.id === landing.categoryId);
  const categoryHasMasks = catalog.masks.some((mask) => mask.categoryId === landing.categoryId);
  if (!categoryExists || !categoryHasMasks) notFound();
  return <AiMaskCategoryLandingPage locale={locale} landing={landing} catalog={catalog} />;
}
