import LocalizedHomeClient from './[locale]/LocalizedHomeClient';
import { NextIntlClientProvider } from 'next-intl';
import type { Metadata } from 'next';
import { locales } from '@/i18n/request';
import { buildAlternates } from '@/lib/seo';
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
  const description = typeof (messages as any)?.hero?.description === 'string'
    ? (messages as any).hero.description as string
    : "Instantly create thousands of hyper-realistic, AI-generated photos for social media, profile pictures, marketing, or personal projects with our next-gen AI photo studio.";
  const baseTitlePart = typeof (messages as any)?.hero?.title === 'string' ? (messages as any).hero.title as string : 'Transform Your Selfies Into';
  const highlightPart = typeof (messages as any)?.hero?.titleHighlight === 'string' ? (messages as any).hero.titleHighlight as string : 'Stunning AI-Generated Portraits';
  const title = `My AI Photo Shoot - ${baseTitlePart} ${highlightPart}`;
  return {
    title,
    description,
    alternates: buildAlternates('en', '/', locales),
  };
}
