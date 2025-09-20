import type { Metadata } from 'next';
import SupportForm from '@/components/app/SupportForm';
import { locales } from '@/i18n/request';
import { buildAlternates, canonicalUrl } from '@/lib/seo';
import { loadMessages } from '@/lib/i18n-messages';

type Props = {
  params: { locale: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = params;
  const messages = await loadMessages(locale);
  const description = typeof (messages as any)?.supportPage?.description === 'string'
    ? (messages as any).supportPage.description as string
    : 'Contact our team for help. We respond within 24–48 hours.';
  const supportTitle = typeof (messages as any)?.supportPage?.title === 'string' ? (messages as any).supportPage.title as string : 'Customer Support';
  return {
    title: `${supportTitle} | My AI Photo Shoot`,
    description,
    alternates: buildAlternates(locale, '/support/', locales),
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: `${supportTitle} | My AI Photo Shoot`,
      description,
      url: canonicalUrl(locale, '/support/'),
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${supportTitle} | My AI Photo Shoot`,
      description,
    },
  };
}

export default async function SupportPage({ params }: Props) {
  return (
    <>
      <main className="min-h-screen pt-24">
        <SupportForm />
      </main>
    </>
  );
}