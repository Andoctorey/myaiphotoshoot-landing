import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import ModelsPage from '@/components/models/ModelsPage';
import { defaultLocale, locales } from '@/i18n/request';
import { buildAlternates, canonicalUrl, ogAlternateLocales, ogLocaleFromAppLocale } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: defaultLocale, namespace: 'models.meta' });
  const title = t('title');
  const description = t('description');

  return {
    title: { absolute: `${title} | My AI Photo Shoot` },
    description,
    alternates: buildAlternates(defaultLocale, '/models/', locales),
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
      url: canonicalUrl(defaultLocale, '/models/'),
      siteName: 'My AI Photo Shoot',
      type: 'website',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'My AI Photo Shoot AI photo model examples',
        },
      ],
      locale: ogLocaleFromAppLocale(defaultLocale),
      alternateLocale: ogAlternateLocales(locales, defaultLocale),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
    },
  };
}

export default function ModelsRoute() {
  return <ModelsPage locale={defaultLocale} />;
}
