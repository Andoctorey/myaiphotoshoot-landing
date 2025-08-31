import type { Metadata } from 'next';
import SupportForm from '@/components/app/SupportForm';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import { locales, defaultLocale } from '@/i18n/request';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const baseUrl = 'https://myaiphotoshoot.com';
  const url = `${baseUrl}/${locale}/support/`;
  return {
    title: 'Customer Support | My AI Photo Shoot',
    description: 'Contact our team for help. We respond within 24–48 hours.',
    alternates: {
      canonical: url,
      languages: {
        ...Object.fromEntries((locales as readonly string[]).map(l => [l, `/${l}/support/`])),
        'x-default': `/${defaultLocale}/support/`,
      },
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: 'Customer Support | My AI Photo Shoot',
      description: 'Contact our team for help. We respond within 24–48 hours.',
      url,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Customer Support | My AI Photo Shoot',
      description: 'Contact our team for help. We respond within 24–48 hours.',
    },
  };
}

export default async function SupportPage({ params }: Props) {
  await params; // ensure route params resolved for static export
  return (
    <>
      <Navigation />
      <main className="min-h-screen pt-24">
        <SupportForm />
      </main>
      <Footer />
    </>
  );
}