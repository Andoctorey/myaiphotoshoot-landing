import type { Metadata } from "next";
import "../globals.css";
import { locales } from "@/i18n/request";
import { NextIntlClientProvider } from 'next-intl';
import SiteShell from '@/components/layout/SiteShell';

export const metadata: Metadata = {
  title: "My AI Photo Shoot - Transform Your Selfies Into Stunning AI Photos",
  description: "Instantly create thousands of hyper-realistic, AI-generated photos for social media, profile pictures, marketing, or personal projects with our next-gen AI photo studio.",
  keywords: ["AI photo shoot", "selfie transformation", "AI-generated photos", "professional photography", "portrait enhancement", "creative photo prompts", "affordable AI photos", "privacy-focused photo app", "Flux.1 AI", "photo editing app"],
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