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
  const messages = await loadMessages('en');
  type HomePageCopy = {
    pageCopy?: {
      home?: {
        metaDescription?: string;
        metaTitle?: string;
        shareDescription?: string;
        shareTitle?: string;
      };
    };
  };
  const pageCopy = (messages as HomePageCopy).pageCopy?.home;
  const description = pageCopy?.metaDescription
    || 'Create realistic AI headshots and portraits from selfies. Start with one-time credits, or unlock personal AI training and up to 4K with Pro or Max.';
  const title = pageCopy?.metaTitle || 'AI Headshot Generator | My AI Photo Shoot';
  const shareTitle = pageCopy?.shareTitle || 'AI Photos That Still Look Like You';
  const shareDescription = pageCopy?.shareDescription
    || 'Create realistic AI photos from selfies. Explore ready-made styles or train a personal AI model, then turn any prompt into photos that still look like you.';
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
      title: shareTitle,
      description: shareDescription,
      url: 'https://myaiphotoshoot.com/',
      siteName: 'My AI Photo Shoot',
      images: [
        {
          url: '/og-image-v2.jpg?v=3',
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
      title: shareTitle,
      description: shareDescription,
      images: [{ url: '/og-image-v2.jpg?v=3', alt: 'My AI Photo Shoot AI headshot examples' }],
    },
  };
}
