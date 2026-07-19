import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import UseCasePageClient from '../../[locale]/use-cases/[slug]/UseCasePageClient';
import { defaultLocale } from '@/i18n/request';
import { fetchUseCase, fetchUseCaseSlugs, generateUseCaseMetadata } from '@/lib/usecase-seo';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return generateUseCaseMetadata(slug, defaultLocale);
}

export async function generateStaticParams() {
  const slugs = await fetchUseCaseSlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function UseCasePage({ params }: PageProps) {
  const { slug } = await params;
  const initialUseCase = await fetchUseCase(slug, defaultLocale);
  if (!initialUseCase) notFound();
  return <UseCasePageClient slug={slug} locale={defaultLocale} initialUseCase={initialUseCase} />;
}
