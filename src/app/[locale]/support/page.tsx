import type { Metadata } from 'next';
import SupportForm from '@/components/app/SupportForm';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import { locales } from '@/i18n/request';
import { buildAlternates, canonicalUrl } from '@/lib/seo';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: 'Customer Support | My AI Photo Shoot',
    description: 'Contact our team for help. We respond within 24–48 hours.',
    alternates: buildAlternates(locale, '/support/', locales),
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: 'Customer Support | My AI Photo Shoot',
      description: 'Contact our team for help. We respond within 24–48 hours.',
      url: canonicalUrl(locale, '/support/'),
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