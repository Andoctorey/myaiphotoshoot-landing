import { locales, defaultLocale } from '@/i18n/request';
import LocalizedHomeClient from './LocalizedHomeClient';
import type { Metadata } from 'next';

// Generate static params for all locales
export async function generateStaticParams() {
  return locales.map((locale) => ({
    locale,
  }));
}

export default function LocalizedHome() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'MobileApplication',
            name: 'My AI Photo Shoot',
            operatingSystem: 'iOS, Android',
            applicationCategory: 'Photo & Video',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD'
            },
            downloadUrl: 'https://myaiphotoshoot.com',
            installUrl: 'https://myaiphotoshoot.com',
            url: 'https://myaiphotoshoot.com',
            availableOnDevice: 'iPhone, Android'
          })
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'My AI Photo Shoot',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'iOS, Android, Web',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD'
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.8',
              ratingCount: '1000'
            },
            url: 'https://myaiphotoshoot.com',
            sameAs: [
              'https://apps.apple.com/app/id6744860178',
              'https://play.google.com/store/apps/details?id=com.myaiphotoshoot'
            ]
          })
        }}
      />
      <LocalizedHomeClient />
    </>
  );
} 

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const baseUrl = 'https://myaiphotoshoot.com';
  const url = `${baseUrl}/${locale}`;
  return {
    alternates: {
      canonical: url,
      languages: {
        ...Object.fromEntries((locales as readonly string[]).map(l => [l, `/${l}`])),
        'x-default': `/${defaultLocale}`,
      },
    },
  };
}