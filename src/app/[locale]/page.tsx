import { locales } from '@/i18n/request';
import { buildAlternates, canonicalUrl } from '@/lib/seo';
import LocalizedHomeClient from './LocalizedHomeClient';
import type { Metadata } from 'next';
import { fetchHomeData } from '@/lib/homeData';
import HomeJsonLd from '@/components/seo/HomeJsonLd';
import { loadMessages } from '@/lib/i18n-messages';

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
  const messages = await loadMessages(locale);
  type HomeI18n = { hero?: { description?: string; title?: string; titleHighlight?: string } };
  const m = messages as HomeI18n;
  const description = typeof m.hero?.description === 'string'
    ? m.hero.description as string
    : 'Instantly create thousands of hyper-realistic, AI-generated photos for social media, profile pictures, marketing, or personal projects with our next-gen AI photo studio.';
  const baseTitlePart = typeof m.hero?.title === 'string' ? m.hero.title as string : 'Transform Your Selfies Into';
  const highlightPart = typeof m.hero?.titleHighlight === 'string' ? m.hero.titleHighlight as string : 'Stunning AI-Generated Portraits';
  const title = `My AI Photo Shoot - ${baseTitlePart} ${highlightPart}`;
  return {
    title,
    description,
    alternates: buildAlternates(locale, '/', locales),
    openGraph: {
      title,
      description,
      url: canonicalUrl(locale, '/'),
      siteName: 'My AI Photo Shoot',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
        locale,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
    },
      other: {
        'og:type': 'product',
      },
  };
}