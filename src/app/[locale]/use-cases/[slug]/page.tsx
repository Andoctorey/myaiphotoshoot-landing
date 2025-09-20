import type { Metadata } from 'next';
import UseCasePageClient from './UseCasePageClient';
import { env } from '@/lib/env';
import { buildAlternates, canonicalUrl, ogAlternateLocales, ogLocaleFromAppLocale } from '@/lib/seo';
import { locales } from '@/i18n/request';
import type { UseCase } from '@/types/usecase';

interface PageProps {
  params: Promise<{ slug: string; locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  try {
    const res = await fetch(`${env.SUPABASE_FUNCTIONS_URL}/use-case?slug=${slug}&locale=${locale}`, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error('not ok');
    const uc = await res.json();
    // Base SEO values from CMS
    const baseTitle = String(uc.meta_title || uc.title || '').trim();
    const siteSuffix = ' | My AI Photo Shoot';
    const pricedSuffix = ' | $2.99 – My AI Photo Shoot';
    // Prefer priced suffix if it fits within 65 chars, else fallback to site suffix if it fits
    let title = baseTitle;
    if (baseTitle) {
      const pricedCandidate = `${baseTitle}${pricedSuffix}`;
      const siteCandidate = `${baseTitle}${siteSuffix}`;
      if (pricedCandidate.length <= 65) {
        title = pricedCandidate;
      } else if (siteCandidate.length <= 65) {
        title = siteCandidate;
      } else {
        title = baseTitle;
      }
    }

    // Description: append pricing line if it fits within 160 chars
    const baseDescription = String(uc.meta_description || uc.title || '').trim();
    const pricingSentence = ' One-time $2.99 model training, ~$0.03 per image. No subscription.';
    let description = baseDescription;
    if (baseDescription) {
      const alreadyHasPricing = /\b\$2\.99\b|No subscription/i.test(baseDescription);
      const withPricing = alreadyHasPricing ? baseDescription : `${baseDescription}${pricingSentence}`;
      description = withPricing.length <= 160 ? withPricing : baseDescription;
    }
    const url = canonicalUrl(locale, `/use-cases/${slug}/`);
    const imageUrl = (Array.isArray(uc.featured_image_urls) && uc.featured_image_urls[0]) || 'https://myaiphotoshoot.com/og-image.png';
    return {
      title,
      description,
      alternates: buildAlternates(locale, `/use-cases/${slug}/`, locales),
      openGraph: {
        title,
        description,
        url,
        siteName: 'My AI Photo Shoot',
        images: [{ url: imageUrl, width: 1200, height: 630, alt: uc.title }],
        locale: ogLocaleFromAppLocale(locale),
        alternateLocale: ogAlternateLocales(locales, locale),
      },
        twitter: { card: 'summary_large_image', title, description, images: [imageUrl] },
        other: {
          'og:type': 'product',
        }
    };
  } catch {
    return { title: 'Use Case | My AI Photo Shoot', description: 'AI photography use cases' };
  }
}

export async function generateStaticParams() {
  try {
    const locs = ['en', 'zh', 'es', 'de', 'fr', 'ja', 'ru', 'ar', 'hi'];
    const baseLocale = 'en';
    const res = await fetch(`${env.SUPABASE_FUNCTIONS_URL}/use-cases?page=1&limit=100&locale=${baseLocale}`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    const items = (data.items || []).filter((it: { slug?: string }) => Boolean(it.slug));
    const slugs: string[] = Array.from(new Set(items.map((it: { slug: string }) => it.slug)));
    const allParams: { slug: string; locale: string }[] = [];
    for (const slug of slugs) {
      for (const locale of locs) {
        allParams.push({ slug, locale });
      }
    }
    return allParams;
  } catch {
    return [];
  }
}

export default async function UseCasePage({ params }: PageProps) {
  const { slug, locale } = await params;
  let initialUseCase: UseCase | undefined = undefined;
  try {
    const res = await fetch(`${env.SUPABASE_FUNCTIONS_URL}/use-case?slug=${slug}&locale=${locale}`, { next: { revalidate: 3600 } });
    if (res.ok) initialUseCase = await res.json();
  } catch {}
  return <UseCasePageClient slug={slug} locale={locale} initialUseCase={initialUseCase} />;
}


