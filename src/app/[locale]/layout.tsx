import type { Metadata } from "next";
import "../globals.css";
import { locales } from "@/i18n/request";
import { NextIntlClientProvider } from 'next-intl';
import SiteShell from '@/components/layout/SiteShell';

export const metadata: Metadata = {
  title: {
    default: "AI Headshot Generator - My AI Photo Shoot",
    template: "%s | My AI Photo Shoot",
  },
  description: "Create realistic AI headshots, profile pictures, and portraits from selfies. Training from $5.99, images from $0.03, no subscription.",
  manifest: "/site.webmanifest",
  // The OpenGraph and Twitter metadata will be dynamically set based on the locale
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  let messages;
  try {
    messages = (await import(`../../../messages/${locale}/index.json`)).default;
  } catch {
    messages = (await import(`../../../messages/en/index.json`)).default;
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SiteShell locale={locale}>{children}</SiteShell>
    </NextIntlClientProvider>
  );
}
