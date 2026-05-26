import type { Metadata } from 'next';
import UseCasesIndex from '@/components/use-cases/UseCasesIndex';
import { defaultLocale, locales } from '@/i18n/request';
import { buildAlternates, canonicalUrl, ogAlternateLocales, ogLocaleFromAppLocale } from '@/lib/seo';
import { loadMessages } from '@/lib/i18n-messages';

type UseCasesI18n = { navigation?: { noUseCases?: string; useCases?: string } };

function getUseCasesLabels(messages: unknown) {
  const m = messages as UseCasesI18n;
  return {
    title: typeof m.navigation?.useCases === 'string' ? m.navigation.useCases : 'Use Cases',
    emptyLabel: typeof m.navigation?.noUseCases === 'string' ? m.navigation.noUseCases : 'No use cases yet',
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const messages = await loadMessages(defaultLocale);
  const { title: titleBase } = getUseCasesLabels(messages);
  const socialTitle = `${titleBase} | My AI Photo Shoot`;
  const description = 'Explore AI photo generation use cases for headshots, dating profiles, social media, marketing, and personal projects.';

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
      siteName: 'My AI Photo Shoot',
      type: 'website',
      locale: ogLocaleFromAppLocale(defaultLocale),
      alternateLocale: ogAlternateLocales(locales, defaultLocale),
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
    },
  };
}

export default async function UseCasesPage() {
  const labels = getUseCasesLabels(await loadMessages(defaultLocale));
  return <UseCasesIndex locale={defaultLocale} title={labels.title} emptyLabel={labels.emptyLabel} />;
}
