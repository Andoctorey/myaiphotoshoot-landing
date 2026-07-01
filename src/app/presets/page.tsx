import type { Metadata } from 'next';
import AiPresetsIndex from '@/components/presets/AiPresetsIndex';
import { defaultLocale, locales } from '@/i18n/request';
import { AI_PRESETS_INDEX_DESCRIPTION, AI_PRESETS_INDEX_TITLE } from '@/lib/ai-presets';
import { buildAlternates, canonicalUrl, ogAlternateLocales, ogLocaleFromAppLocale } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: { absolute: AI_PRESETS_INDEX_TITLE },
    description: AI_PRESETS_INDEX_DESCRIPTION,
    alternates: buildAlternates(defaultLocale, '/presets/', locales),
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
      title: AI_PRESETS_INDEX_TITLE,
      description: AI_PRESETS_INDEX_DESCRIPTION,
      url: canonicalUrl(defaultLocale, '/presets/'),
      siteName: 'My AI Photo Shoot',
      type: 'website',
      locale: ogLocaleFromAppLocale(defaultLocale),
      alternateLocale: ogAlternateLocales(locales, defaultLocale),
    },
    twitter: { card: 'summary_large_image', title: AI_PRESETS_INDEX_TITLE, description: AI_PRESETS_INDEX_DESCRIPTION },
  };
}

export default function PresetsPage() {
  return <AiPresetsIndex locale={defaultLocale} />;
}
