import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import AiPresetsIndex from '@/components/presets/AiPresetsIndex';
import { defaultLocale, locales } from '@/i18n/request';
import {
  AI_PRESETS_INDEX_DESCRIPTION,
  AI_PRESETS_INDEX_TITLE,
  aiPresetsPagePath,
  fetchAiPresetsPage,
} from '@/lib/ai-presets';
import { buildAlternates, canonicalUrl, ogAlternateLocales, ogLocaleFromAppLocale } from '@/lib/seo';

interface PageProps {
  params: Promise<{ pageNumber: string }>;
}

export const dynamicParams = false;

function parsePageParam(value: string): number | null {
  const page = Number(value);
  return Number.isInteger(page) && page > 1 ? page : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const parsedPage = parsePageParam((await params).pageNumber);
  if (!parsedPage) return { robots: { index: false, follow: true } };
  const pageData = await fetchAiPresetsPage(defaultLocale, parsedPage);
  const shouldIndex = parsedPage <= pageData.totalPages && pageData.presets.length > 0;
  const path = aiPresetsPagePath(parsedPage);
  const title = `${AI_PRESETS_INDEX_TITLE} - Page ${parsedPage}`;

  return {
    title: { absolute: title },
    description: AI_PRESETS_INDEX_DESCRIPTION,
    alternates: buildAlternates(defaultLocale, path, locales),
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
      description: AI_PRESETS_INDEX_DESCRIPTION,
      url: canonicalUrl(defaultLocale, path),
      siteName: 'My AI Photo Shoot',
      type: 'website',
      locale: ogLocaleFromAppLocale(defaultLocale),
      alternateLocale: ogAlternateLocales(locales, defaultLocale),
    },
    twitter: { card: 'summary_large_image', title, description: AI_PRESETS_INDEX_DESCRIPTION },
  };
}

export async function generateStaticParams() {
  const page = await fetchAiPresetsPage(defaultLocale, 1);
  return Array.from({ length: Math.max(1, page.totalPages - 1) }, (_, index) => ({
    pageNumber: String(index + 2),
  }));
}

export default async function PresetsPaginatedPage({ params }: PageProps) {
  const parsedPage = parsePageParam((await params).pageNumber);
  if (!parsedPage) notFound();
  const pageData = await fetchAiPresetsPage(defaultLocale, parsedPage);
  if (pageData.totalPages > 1 && (parsedPage > pageData.totalPages || pageData.presets.length === 0)) notFound();
  return <AiPresetsIndex locale={defaultLocale} page={parsedPage} pageData={pageData} />;
}
