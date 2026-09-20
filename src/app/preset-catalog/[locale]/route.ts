import { NextResponse } from 'next/server';
import { locales, type Locale } from '@/i18n/request';
import { fetchAiPresetCatalog } from '@/lib/ai-presets';

type RouteContext = {
  params: Promise<{ locale: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) {
    return NextResponse.json({ error: 'Unsupported locale.' }, { status: 404 });
  }

  return NextResponse.json(await fetchAiPresetCatalog(locale));
}
