import type { Metadata } from 'next';
import UseCasePageClient from '../../[locale]/use-cases/[slug]/UseCasePageClient';
import { defaultLocale } from '@/i18n/request';
import { fetchUseCase, fetchUseCaseSlugs, generateUseCaseMetadata } from '@/lib/usecase-seo';

interface PageProps {
  params: Promise<{ slug: string }>;
}

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
  return <UseCasePageClient slug={slug} locale={defaultLocale} initialUseCase={initialUseCase} />;
}
