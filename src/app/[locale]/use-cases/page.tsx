import type { Metadata } from 'next';
import UseCasesIndex from '@/components/use-cases/UseCasesIndex';
import { locales } from '@/i18n/request';
import { buildAlternates, canonicalUrl, ogAlternateLocales, ogLocaleFromAppLocale } from '@/lib/seo';
import { loadMessages } from '@/lib/i18n-messages';

interface PageProps {
  params: Promise<{ locale: string }>;
}

type UseCasesI18n = {
  navigation?: { noUseCases?: string };
  pageCopy?: {
    useCases?: {
      intro?: string;
      metaDescription?: string;
      metaTitle?: string;
      title?: string;
    };
  };
};

function getUseCasesLabels(messages: unknown) {
  const m = messages as UseCasesI18n;
  return {
    title: m.pageCopy?.useCases?.title || 'AI Photo Use Cases',
    intro: m.pageCopy?.useCases?.intro
      || 'Discover ways to create professional headshots, dating profile photos, social content, and creative portraits with AI.',
    metaTitle: m.pageCopy?.useCases?.metaTitle || 'AI Photo Use Cases',
    metaDescription: m.pageCopy?.useCases?.metaDescription
      || 'Explore AI photo use cases for professional headshots, dating profiles, social media, marketing, and creative portraits.',
    emptyLabel: typeof m.navigation?.noUseCases === 'string' ? m.navigation.noUseCases : 'No use cases yet',
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const messages = await loadMessages(locale);
  const { metaDescription: description, metaTitle: titleBase } = getUseCasesLabels(messages);
  const socialTitle = `${titleBase} | My AI Photo Shoot`;

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
      images: [{ url: '/og-image-v2.jpg?v=4', width: 1200, height: 630, alt: socialTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
      images: [{ url: '/og-image-v2.jpg?v=4', alt: socialTitle }],
    },
  };
}

export default async function UseCasesPage({ params }: PageProps) {
  const { locale } = await params;
  const labels = getUseCasesLabels(await loadMessages(locale));
  return (
    <UseCasesIndex
      locale={locale}
      title={labels.title}
      intro={labels.intro}
      emptyLabel={labels.emptyLabel}
    />
  );
}
