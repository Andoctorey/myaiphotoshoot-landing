import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import UseCasePageClient from './UseCasePageClient';
import { locales } from '@/i18n/request';
import { fetchUseCase, fetchUseCaseSlugs, generateUseCaseMetadata } from '@/lib/usecase-seo';

interface PageProps {
  params: Promise<{ slug: string; locale: string }>
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  return generateUseCaseMetadata(slug, locale);
}

export async function generateStaticParams() {
  const slugs = await fetchUseCaseSlugs();
  const allParams: { slug: string; locale: string }[] = [];
  for (const slug of slugs) {
    for (const locale of locales) {
      allParams.push({ slug, locale });
    }
  }
  return allParams;
}

export default async function UseCasePage({ params }: PageProps) {
  const { slug, locale } = await params;
  const initialUseCase = await fetchUseCase(slug, locale);
  if (!initialUseCase) notFound();
  return <UseCasePageClient slug={slug} locale={locale} initialUseCase={initialUseCase} />;
}
