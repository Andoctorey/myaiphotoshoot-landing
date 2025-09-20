import type { Metadata } from 'next';
import UseCasePageClient from './UseCasePageClient';
import { env } from '@/lib/env';
import { buildAlternates, canonicalUrl } from '@/lib/seo';
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
    const title = `${uc.meta_title || uc.title} | My AI Photo Shoot`;
    const description = uc.meta_description || uc.title;
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
        locale,
        type: 'article'
      },
      twitter: { card: 'summary_large_image', title, description, images: [imageUrl] }
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


