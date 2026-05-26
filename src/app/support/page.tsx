import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import SupportForm from '@/components/app/SupportForm';
import SiteShell from '@/components/layout/SiteShell';
import { defaultLocale, locales } from '@/i18n/request';
import { buildAlternates, canonicalUrl, ogAlternateLocales, ogLocaleFromAppLocale } from '@/lib/seo';
import { loadMessages } from '@/lib/i18n-messages';

export async function generateMetadata(): Promise<Metadata> {
  const messages = await loadMessages(defaultLocale);
  type SupportI18n = { supportPage?: { description?: string; title?: string } };
  const m = messages as SupportI18n;
  const description = typeof m.supportPage?.description === 'string'
    ? m.supportPage.description
    : 'Contact our team for help. We respond within 24-48 hours.';
  const supportTitle = typeof m.supportPage?.title === 'string' ? m.supportPage.title : 'Customer Support';
  const socialTitle = `${supportTitle} | My AI Photo Shoot`;

  return {
    title: supportTitle,
    description,
    alternates: buildAlternates(defaultLocale, '/support/', locales),
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: socialTitle,
      description,
      url: canonicalUrl(defaultLocale, '/support/'),
      type: 'website',
      locale: ogLocaleFromAppLocale(defaultLocale),
      alternateLocale: ogAlternateLocales(locales, defaultLocale),
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
    },
  };
}

export default async function SupportPage() {
  const messages = await loadMessages(defaultLocale);

  return (
    <NextIntlClientProvider locale={defaultLocale} messages={messages}>
      <SiteShell locale={defaultLocale}>
        <main className="min-h-screen pt-24">
          <SupportForm />
        </main>
      </SiteShell>
    </NextIntlClientProvider>
  );
}
