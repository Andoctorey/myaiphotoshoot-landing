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
  type HomeI18n = {
    pageCopy?: {
      home?: {
        metaDescription?: string;
        metaTitle?: string;
        shareDescription?: string;
        shareTitle?: string;
      };
    };
  };
  const m = messages as HomeI18n;
  const title = m.pageCopy?.home?.metaTitle || 'AI Photo & Headshot Generator | My AI Photo Shoot';
  const description = m.pageCopy?.home?.metaDescription
    || 'Create headshots, profile photos, portraits, and transformations with presets, AI Masks, Studio, or prompts. Pay as you go; personal model training is optional.';
  const shareTitle = m.pageCopy?.home?.shareTitle || 'Create and Transform AI Photos';
  const shareDescription = m.pageCopy?.home?.shareDescription
    || 'Create and transform AI photos with presets, AI Masks, Studio, and custom prompts for headshots, profile photos, portraits, and creative photos.';
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
      title: shareTitle,
      description: shareDescription,
      url: canonicalUrl(locale, '/'),
      siteName: 'My AI Photo Shoot',
      type: 'website',
      images: [
        {
          url: '/og-image-v2.jpg?v=4',
          width: 1200,
          height: 630,
          alt: shareTitle,
        },
      ],
      locale: ogLocaleFromAppLocale(locale),
      alternateLocale: ogAlternateLocales(locales, locale),
    },
    twitter: {
      card: 'summary_large_image',
      title: shareTitle,
      description: shareDescription,
      images: [{ url: '/og-image-v2.jpg?v=4', alt: shareTitle }],
    },
  };
}
