import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import AiPresetPage from '@/components/presets/AiPresetPage';
import { defaultLocale } from '@/i18n/request';
import { fetchAiPreset, fetchAiPresetSlugs, generateAiPresetMetadata } from '@/lib/ai-presets';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return generateAiPresetMetadata(slug, defaultLocale);
}

export async function generateStaticParams() {
  const slugs = await fetchAiPresetSlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function PresetPage({ params }: PageProps) {
  const { slug } = await params;
  const preset = await fetchAiPreset(slug, defaultLocale);
  if (!preset) notFound();
  return <AiPresetPage locale={defaultLocale} preset={preset} />;
}
