import type { Metadata } from 'next';
import SupportForm from '@/components/app/SupportForm';
import { locales } from '@/i18n/request';
import { buildAlternates, canonicalUrl, ogAlternateLocales, ogLocaleFromAppLocale } from '@/lib/seo';
import { loadMessages } from '@/lib/i18n-messages';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const messages = await loadMessages(locale);
  type SupportI18n = { supportPage?: { description?: string; title?: string } };
  const m = messages as SupportI18n;
  const description = typeof m.supportPage?.description === 'string'
    ? m.supportPage.description as string
    : 'Contact our team for help. We respond within 24–48 hours.';
  const supportTitle = typeof m.supportPage?.title === 'string' ? m.supportPage.title as string : 'Customer Support';
  return {
    title: `${supportTitle} | My AI Photo Shoot`,
    description,
    alternates: buildAlternates(locale, '/support/', locales),
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: `${supportTitle} | My AI Photo Shoot`,
      description,
      url: canonicalUrl(locale, '/support/'),
      type: 'website',
      locale: ogLocaleFromAppLocale(locale),
      alternateLocale: ogAlternateLocales(locales, locale),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${supportTitle} | My AI Photo Shoot`,
      description,
    },
  };
}

export default async function SupportPage({ params }: { params: Promise<{ locale: string }> }) {
  await params;
  return (
    <>
      <main className="min-h-screen pt-24">
        <SupportForm />
      </main>
    </>
  );
}