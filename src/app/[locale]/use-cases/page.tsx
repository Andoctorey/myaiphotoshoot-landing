import type { Metadata } from 'next';
import UseCasesIndex from '@/components/use-cases/UseCasesIndex';
import { locales } from '@/i18n/request';
import { buildAlternates, canonicalUrl, ogAlternateLocales, ogLocaleFromAppLocale } from '@/lib/seo';
import { loadMessages } from '@/lib/i18n-messages';

interface PageProps {
  params: Promise<{ locale: string }>;
}

type UseCasesI18n = { navigation?: { noUseCases?: string; useCases?: string } };

function getUseCasesLabels(messages: unknown) {
  const m = messages as UseCasesI18n;
  return {
    title: typeof m.navigation?.useCases === 'string' ? m.navigation.useCases : 'Use Cases',
    emptyLabel: typeof m.navigation?.noUseCases === 'string' ? m.navigation.noUseCases : 'No use cases yet',
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const messages = await loadMessages(locale);
  const { title: titleBase } = getUseCasesLabels(messages);
  const socialTitle = `${titleBase} | My AI Photo Shoot`;
  const description = 'Explore AI photo generation use cases for headshots, dating profiles, social media, marketing, and personal projects.';

  return {
    title: titleBase,
    description,
    alternates: buildAlternates(locale, '/use-cases/', locales),
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
      title: socialTitle,
      description,
      url: canonicalUrl(locale, '/use-cases/'),
      siteName: 'My AI Photo Shoot',
      type: 'website',
      locale: ogLocaleFromAppLocale(locale),
      alternateLocale: ogAlternateLocales(locales, locale),
      images: [{ url: '/og-image-v2.jpg', width: 1200, height: 630, alt: socialTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
      images: [{ url: '/og-image-v2.jpg', alt: socialTitle }],
    },
  };
}

export default async function UseCasesPage({ params }: PageProps) {
  const { locale } = await params;
  const labels = getUseCasesLabels(await loadMessages(locale));
  return <UseCasesIndex locale={locale} title={labels.title} emptyLabel={labels.emptyLabel} />;
}
