import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import AiPresetPage from '@/components/presets/AiPresetPage';
import { locales } from '@/i18n/request';
import { fetchAiPreset, fetchAiPresetSlugs, generateAiPresetMetadata } from '@/lib/ai-presets';

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  return generateAiPresetMetadata(slug, locale);
}

export async function generateStaticParams() {
  const slugs = await fetchAiPresetSlugs();
  const allParams: { slug: string; locale: string }[] = [];
  for (const slug of slugs) {
    for (const locale of locales) {
      allParams.push({ slug, locale });
    }
  }
  return allParams;
}

export default async function PresetPage({ params }: PageProps) {
  const { slug, locale } = await params;
  const preset = await fetchAiPreset(slug, locale);
  if (!preset) notFound();
  return <AiPresetPage locale={locale} preset={preset} />;
}
