import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import AiPresetsIndex from '@/components/presets/AiPresetsIndex';
import { locales } from '@/i18n/request';
import { buildAlternates, canonicalUrl, ogAlternateLocales, ogLocaleFromAppLocale } from '@/lib/seo';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'presets' });
  const title = `${t('title')} | My AI Photo Shoot`;
  const description = t('description');

  return {
    title: { absolute: title },
    description,
    alternates: buildAlternates(locale, '/presets/', locales),
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl(locale, '/presets/'),
      siteName: 'My AI Photo Shoot',
      type: 'website',
      locale: ogLocaleFromAppLocale(locale),
      alternateLocale: ogAlternateLocales(locales, locale),
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function PresetsPage({ params }: PageProps) {
  const { locale } = await params;
  return <AiPresetsIndex locale={locale} />;
}
