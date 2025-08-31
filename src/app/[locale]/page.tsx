import { locales } from '@/i18n/request';
import { buildAlternates } from '@/lib/seo';
import LocalizedHomeClient from './LocalizedHomeClient';
import type { Metadata } from 'next';
import { fetchHomeData } from '@/lib/homeData';
import HomeJsonLd from '@/components/seo/HomeJsonLd';

// Generate static params for all locales
export async function generateStaticParams() {
  return locales.map((locale) => ({
    locale,
  }));
}

export default async function LocalizedHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { initialGallery, initialBlog } = await fetchHomeData(locale);
  return (
    <>
      <HomeJsonLd />
      <LocalizedHomeClient initialGallery={initialGallery} initialBlog={initialBlog} />
    </>
  );
}

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    alternates: buildAlternates(locale, '/', locales),
  };
}