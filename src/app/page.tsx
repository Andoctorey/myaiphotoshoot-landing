import HomeContent from '@/components/features/HomeContent';
import { NextIntlClientProvider } from 'next-intl';
import type { Metadata } from 'next';
import { locales } from '@/i18n/request';
import { buildAlternates, ogAlternateLocales, ogLocaleFromAppLocale } from '@/lib/seo';
import { fetchHomeData } from '@/lib/homeData';
import HomeJsonLd from '@/components/seo/HomeJsonLd';
import { loadMessages } from '@/lib/i18n-messages';
import SiteShell from '@/components/layout/SiteShell';

export default async function Home() {
  const locale = 'en';

  const { initialGallery, initialGallerySession, initialBlog, initialUseCases } = await fetchHomeData(locale);
  const messages = await loadMessages(locale);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <HomeJsonLd locale={locale} />
      <SiteShell locale={locale}>
        <HomeContent
          locale={locale}
          initialGallery={initialGallery}
          initialGallerySession={initialGallerySession}
          initialBlog={initialBlog}
          initialUseCases={initialUseCases}
        />
      </SiteShell>
    </NextIntlClientProvider>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const description = 'Create realistic AI headshots, profile pictures, and portraits from selfies. Training from $5.99, images from $0.03, no subscription.';
  const title = 'AI Headshot Generator - My AI Photo Shoot';
  return {
    title: { absolute: title }, // concise HTML title
    description,
    alternates: buildAlternates('en', '/', locales),
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
      title: 'AI Headshot Generator - Realistic Profile Photos From Selfies',
      description,
      url: 'https://myaiphotoshoot.com/',
      siteName: 'My AI Photo Shoot',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'My AI Photo Shoot AI headshot examples',
        },
      ],
      locale: ogLocaleFromAppLocale('en'),
      alternateLocale: ogAlternateLocales(locales, 'en'),
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'AI Headshot Generator - Realistic Profile Photos From Selfies',
      description,
      images: ['/og-image.png'],
    },
  };
}
