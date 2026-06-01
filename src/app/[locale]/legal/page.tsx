import { Metadata } from 'next';
import { defaultLocale } from '@/i18n/request';
import { canonicalUrl, ogLocaleFromAppLocale } from '@/lib/seo';
import LegalDocument from '@/components/legal/LegalDocument';

type Props = { params: Promise<{ locale: string }> };

const title = 'Legal - Terms of Service and Privacy Policy - My AI Photo Shoot';
const description = 'Terms of Service and Privacy Policy for My AI Photo Shoot';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: { absolute: title },
    description,
    robots: 'noindex, follow',
    alternates: {
      canonical: canonicalUrl(defaultLocale, '/legal/'),
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl(defaultLocale, '/legal/'),
      siteName: 'My AI Photo Shoot',
      type: 'website',
      locale: ogLocaleFromAppLocale(locale),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function LegalPage({ params }: { params: Promise<{ locale: string }> }) {
  await params;

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
