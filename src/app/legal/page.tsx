import { Metadata } from 'next';
import { defaultLocale, locales } from '@/i18n/request';
import { buildAlternates, canonicalUrl, ogAlternateLocales, ogLocaleFromAppLocale } from '@/lib/seo';
import LegalDocument from '@/components/legal/LegalDocument';

const title = 'Legal - Terms of Service and Privacy Policy - My AI Photo Shoot';
const description = 'Terms of Service and Privacy Policy for My AI Photo Shoot';

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  robots: 'index, follow',
  alternates: buildAlternates(defaultLocale, '/legal/', locales),
  openGraph: {
    title,
    description,
    url: canonicalUrl(defaultLocale, '/legal/'),
    siteName: 'My AI Photo Shoot',
    type: 'website',
    locale: ogLocaleFromAppLocale(defaultLocale),
    alternateLocale: ogAlternateLocales(locales, defaultLocale),
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
};

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
          <LegalDocument />
        </div>
      </div>
    </div>
  );
}
