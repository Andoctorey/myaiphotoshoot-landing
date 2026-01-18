import { NextIntlClientProvider } from 'next-intl';
import SiteShell from '@/components/layout/SiteShell';
import { defaultLocale } from '@/i18n/request';
import { loadMessages } from '@/lib/i18n-messages';

export default async function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await loadMessages(defaultLocale);

  return (
    <NextIntlClientProvider locale={defaultLocale} messages={messages}>
      <SiteShell locale={defaultLocale}>{children}</SiteShell>
    </NextIntlClientProvider>
  );
}
