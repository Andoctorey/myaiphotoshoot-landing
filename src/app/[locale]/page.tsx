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
  return <LocalizedHomeClient />;
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