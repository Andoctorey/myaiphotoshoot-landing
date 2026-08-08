import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import StudioPage from '@/components/studio/StudioPage';
import { defaultLocale, locales } from '@/i18n/request';
import { buildAlternates, canonicalUrl, ogAlternateLocales, ogLocaleFromAppLocale } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: defaultLocale, namespace: 'studio.meta' });
  const title = t('title');
  const description = t('description');
  const shareTitle = t('shareTitle');
  const shareDescription = t('shareDescription');
  const imageAlt = t('imageAlt');

  return {
    title: { absolute: `${title} | My AI Photo Shoot` },
    description,
    alternates: buildAlternates(defaultLocale, '/studio/', locales),
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
      title: shareTitle,
      description: shareDescription,
      url: canonicalUrl(defaultLocale, '/studio/'),
      siteName: 'My AI Photo Shoot',
      type: 'website',
      images: [
        {
          url: '/og-image-v2.jpg?v=4',
          width: 1200,
          height: 630,
          alt: imageAlt,
        },
      ],
      locale: ogLocaleFromAppLocale(defaultLocale),
      alternateLocale: ogAlternateLocales(locales, defaultLocale),
    },
    twitter: {
      card: 'summary_large_image',
      title: shareTitle,
      description: shareDescription,
      images: [{ url: '/og-image-v2.jpg?v=4', alt: imageAlt }],
    },
  };
}

export default function StudioRoute() {
  return <StudioPage locale={defaultLocale} />;
}
