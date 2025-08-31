import LocalizedHomeClient from './[locale]/LocalizedHomeClient';
import { NextIntlClientProvider } from 'next-intl';
import type { Metadata } from 'next';
import { locales } from '@/i18n/request';
import { buildAlternates } from '@/lib/seo';
import { fetchHomeData } from '@/lib/homeData';
import HomeJsonLd from '@/components/seo/HomeJsonLd';
import { loadMessages } from '@/lib/i18n-messages';

export default async function Home() {
  const locale = 'en';

  const { initialGallery, initialBlog } = await fetchHomeData(locale);
  const messages = await loadMessages(locale);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <HomeJsonLd />
      <LocalizedHomeClient initialGallery={initialGallery} initialBlog={initialBlog} />
    </NextIntlClientProvider>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    alternates: buildAlternates('en', '/', locales),
  };
}
