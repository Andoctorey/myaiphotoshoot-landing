import { locales } from '@/i18n/request';
import { buildAlternates, canonicalUrl, ogAlternateLocales, ogLocaleFromAppLocale } from '@/lib/seo';
import HomeContent from '@/components/features/HomeContent';
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
  const { initialGallery, initialGallerySession, initialBlog, initialUseCases } = await fetchHomeData(locale);
  return (
    <>
      <HomeJsonLd locale={locale} />
      <HomeContent
        locale={locale}
        initialGallery={initialGallery}
        initialGallerySession={initialGallerySession}
        initialBlog={initialBlog}
        initialUseCases={initialUseCases}
      />
    </>
  );
}

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const messages = await loadMessages(locale);
  type HomeI18n = { hero?: { description?: string; title?: string; titleHighlight?: string } };
  const m = messages as HomeI18n;
  const title = [m.hero?.title, m.hero?.titleHighlight]
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .join(' ') || 'AI Headshot Generator - My AI Photo Shoot';
  const description = typeof m.hero?.description === 'string'
    ? m.hero.description
    : 'Create realistic AI headshots, profile pictures, and portraits from selfies. Training from $5.99, images from $0.03, no subscription.';
  return {
    title: { absolute: title }, // concise HTML title
    description,
    alternates: buildAlternates(locale, '/', locales),
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      // Keep richer OG title for social sharing
      title,
      description,
      url: canonicalUrl(locale, '/'),
      siteName: 'My AI Photo Shoot',
      type: 'website',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: ogLocaleFromAppLocale(locale),
      alternateLocale: ogAlternateLocales(locales, locale),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
    },
  };
}
