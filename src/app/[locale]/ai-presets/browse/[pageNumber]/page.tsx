import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import AiPresetsIndex from '@/components/presets/AiPresetsIndex';
import { locales } from '@/i18n/request';
import {
  AI_PRESETS_PAGE_SIZE,
  aiPresetsPagePath,
  fetchAiPresetSlugs,
  fetchAiPresetsPageStrict,
} from '@/lib/ai-presets';
import { buildAlternates, canonicalUrl, ogAlternateLocales, ogLocaleFromAppLocale } from '@/lib/seo';

interface PageProps {
  params: Promise<{ locale: string; pageNumber: string }>;
}

export const dynamicParams = false;

function parsePageParam(value: string): number | null {
  const page = Number(value);
  return Number.isInteger(page) && page > 1 ? page : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, pageNumber } = await params;
  const parsedPage = parsePageParam(pageNumber);
  if (!parsedPage) return { robots: { index: false, follow: true } };
  const pageData = await fetchAiPresetsPageStrict(locale, parsedPage);
  const shouldIndex = parsedPage <= pageData.totalPages && pageData.presets.length > 0;
  const t = await getTranslations({ locale, namespace: 'presets' });
  const path = aiPresetsPagePath(parsedPage);
  const title = `${t('title')} - ${t('paginationPageTitle', { page: parsedPage })} | My AI Photo Shoot`;
  const description = t('description');

  return {
    title: { absolute: title },
    description,
    alternates: buildAlternates(locale, path, locales),
    robots: {
      index: shouldIndex,
      follow: true,
      googleBot: {
        index: shouldIndex,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl(locale, path),
      siteName: 'My AI Photo Shoot',
      type: 'website',
      locale: ogLocaleFromAppLocale(locale),
      alternateLocale: ogAlternateLocales(locales, locale),
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export async function generateStaticParams() {
  const slugs = await fetchAiPresetSlugs();
  const totalPages = Math.ceil(slugs.length / AI_PRESETS_PAGE_SIZE);
  const pageNumbers = Array.from(
    { length: totalPages - 1 },
    (_, index) => String(index + 2),
  );
  return locales.flatMap((locale) => pageNumbers.map((pageNumber) => ({ locale, pageNumber })));
}

export default async function PresetsPaginatedPage({ params }: PageProps) {
  const { locale, pageNumber } = await params;
  const parsedPage = parsePageParam(pageNumber);
  if (!parsedPage) notFound();
  const pageData = await fetchAiPresetsPageStrict(locale, parsedPage);
  if (parsedPage > pageData.totalPages || pageData.presets.length === 0) notFound();
  return <AiPresetsIndex locale={locale} page={parsedPage} pageData={pageData} />;
}
