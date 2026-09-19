import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import UserGallery from '@/components/features/Testimonials';
import { defaultLocale, locales } from '@/i18n/request';
import { buildAlternates, canonicalUrl, ogAlternateLocales, ogLocaleFromAppLocale } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: defaultLocale, namespace: 'gallery' });
  const title = `${t('title')} | My AI Photoshoot`;
  const description = t('description');

  return {
    title: { absolute: title },
    description,
    alternates: buildAlternates(defaultLocale, '/gallery/', locales),
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
      url: canonicalUrl(defaultLocale, '/gallery/'),
      siteName: 'My AI Photoshoot',
      type: 'website',
      locale: ogLocaleFromAppLocale(defaultLocale),
      alternateLocale: ogAlternateLocales(locales, defaultLocale),
      images: [{ url: '/og-image-v2.jpg?v=8', width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [{ url: '/og-image-v2.jpg?v=8', alt: title }],
    },
  };
}

export default function GalleryPage() {
  return <UserGallery preview={false} />;
}
