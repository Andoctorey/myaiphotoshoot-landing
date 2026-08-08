import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import ModelsPage from '@/components/models/ModelsPage';
import { locales } from '@/i18n/request';
import { buildAlternates, canonicalUrl, ogAlternateLocales, ogLocaleFromAppLocale } from '@/lib/seo';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'models.meta' });
  const title = t('title');
  const description = t('description');
  const shareTitle = t('shareTitle');
  const shareDescription = t('shareDescription');

  return {
    title: { absolute: `${title} | My AI Photo Shoot` },
    description,
    alternates: buildAlternates(locale, '/models/', locales),
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
      url: canonicalUrl(locale, '/models/'),
      siteName: 'My AI Photo Shoot',
      type: 'website',
      images: [
        {
          url: '/og-image-v2.jpg?v=4',
          width: 1200,
          height: 630,
          alt: 'My AI Photo Shoot AI photo model examples',
        },
      ],
      locale: ogLocaleFromAppLocale(locale),
      alternateLocale: ogAlternateLocales(locales, locale),
    },
    twitter: {
      card: 'summary_large_image',
      title: shareTitle,
      description: shareDescription,
      images: [{ url: '/og-image-v2.jpg?v=4', alt: shareTitle }],
    },
  };
}

export default async function LocalizedModelsRoute({ params }: Props) {
  const { locale } = await params;
  return <ModelsPage locale={locale} />;
}
