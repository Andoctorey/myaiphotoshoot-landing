import LocalizedHomeClient from './[locale]/LocalizedHomeClient';
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

  const { initialGallery, initialBlog } = await fetchHomeData(locale);
  const messages = await loadMessages(locale);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <HomeJsonLd />
      <SiteShell locale={locale}>
        <LocalizedHomeClient initialGallery={initialGallery} initialBlog={initialBlog} />
      </SiteShell>
    </NextIntlClientProvider>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const messages = await loadMessages('en');
  type HomeI18n = { hero?: { description?: string; title?: string; titleHighlight?: string } };
  const m = messages as HomeI18n;
  const description = typeof m.hero?.description === 'string'
    ? m.hero.description as string
    : "Instantly create thousands of hyper-realistic, AI-generated photos for social media, profile pictures, marketing, or personal projects with our next-gen AI photo studio.";
  const title = 'My AI Photo Shoot – AI Photo Generator';
  return {
    title, // concise HTML title
    description,
    alternates: buildAlternates('en', '/', locales),
    openGraph: {
      // Keep richer OG title for social sharing
      title: 'My AI Photo Shoot - Transform Your Selfies Into Stunning AI-Generated Portraits',
      description,
      url: 'https://myaiphotoshoot.com/',
      siteName: 'My AI Photo Shoot',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'My AI Photo Shoot - Transform your selfies with AI',
        },
      ],
      locale: ogLocaleFromAppLocale('en'),
      alternateLocale: ogAlternateLocales(locales, 'en'),
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'My AI Photo Shoot - Transform Your Selfies Into Stunning AI-Generated Portraits',
      description,
      images: ['/og-image.png'],
    },
  };
}
