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
    : 'Get help with photos, payments, or your account. We respond within 24-48 hours.';
  const supportTitle = typeof m.supportPage?.title === 'string' ? m.supportPage.title as string : 'Customer Support';
  const socialTitle = `${supportTitle} | My AI Photo Shoot`;
  return {
    title: supportTitle,
    description,
    alternates: buildAlternates(locale, '/support/', locales),
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: socialTitle,
      description,
      url: canonicalUrl(locale, '/support/'),
      type: 'website',
      locale: ogLocaleFromAppLocale(locale),
      alternateLocale: ogAlternateLocales(locales, locale),
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
    },
  };
}

export default function SupportPage() {
  return (
    <div className="min-h-screen pt-24">
      <SupportForm />
    </div>
  );
}
