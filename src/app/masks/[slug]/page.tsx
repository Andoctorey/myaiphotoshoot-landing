import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import AiMaskCategoryLandingPage from '@/components/masks/AiMaskCategoryLandingPage';
import { defaultLocale } from '@/i18n/request';
import {
  fetchPublishedMaskCategoryLandings,
  findPublishedMaskCategoryLanding,
  generateMaskCategoryLandingMetadata,
} from '@/lib/ai-mask-landings';
import { fetchMasksCatalogStrict } from '@/lib/ai-masks';

type PageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export async function generateStaticParams() {
  const catalog = await fetchMasksCatalogStrict(defaultLocale);
  return catalog.categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return generateMaskCategoryLandingMetadata(slug, defaultLocale);
}

export default async function MaskCategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const [landings, catalog] = await Promise.all([
    fetchPublishedMaskCategoryLandings(defaultLocale),
    fetchMasksCatalogStrict(defaultLocale),
  ]);
  const landing = findPublishedMaskCategoryLanding(landings, slug, defaultLocale);
  if (!landing) notFound();
  const categoryExists = catalog.categories.some((category) => category.id === landing.categoryId);
  const categoryHasMasks = catalog.masks.some((mask) => mask.categoryId === landing.categoryId);
  if (!categoryExists || !categoryHasMasks) notFound();
  return <AiMaskCategoryLandingPage locale={defaultLocale} landing={landing} catalog={catalog} />;
}
