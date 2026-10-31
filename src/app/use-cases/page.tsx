import { getUseCasesLabels } from '@/lib/use-cases-labels';
import type { Metadata } from 'next';
import UseCasesIndex from '@/components/use-cases/UseCasesIndex';
import { defaultLocale, locales } from '@/i18n/request';
import { buildAlternates, canonicalUrl, ogAlternateLocales, ogLocaleFromAppLocale } from '@/lib/seo';
import { loadMessages } from '@/lib/i18n-messages';

export async function generateMetadata(): Promise<Metadata> {
  const messages = await loadMessages(defaultLocale);
  const { metaDescription: description, metaTitle: titleBase } = getUseCasesLabels(messages);
  const socialTitle = `${titleBase} | My AI Photoshoot`;

  return {
    title: titleBase,
    description,
    alternates: buildAlternates(defaultLocale, '/use-cases/', locales),
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
      url: canonicalUrl(defaultLocale, '/use-cases/'),
      siteName: 'My AI Photoshoot',
      type: 'website',
      locale: ogLocaleFromAppLocale(defaultLocale),
      alternateLocale: ogAlternateLocales(locales, defaultLocale),
      images: [{ url: '/og-image-v2.jpg?v=8', width: 1200, height: 630, alt: socialTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
      images: [{ url: '/og-image-v2.jpg?v=8', alt: socialTitle }],
    },
  };
}

export default async function UseCasesPage() {
  const labels = getUseCasesLabels(await loadMessages(defaultLocale));
  return (
    <UseCasesIndex
      locale={defaultLocale}
      title={labels.title}
      intro={labels.intro}
      emptyLabel={labels.emptyLabel}
    />
  );
}
