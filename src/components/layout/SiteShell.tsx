import HtmlLang from '@/components/layout/HtmlLang';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import { isRTLLanguage } from '@/lib/utils';
import { fetchNavigationUseCases } from '@/lib/navigationUseCases';
import { getTranslations } from 'next-intl/server';

type Props = {
  locale: string;
  children: React.ReactNode;
};

export default async function SiteShell({ locale, children }: Props) {
  const dir: 'ltr' | 'rtl' = isRTLLanguage(locale) ? 'rtl' : 'ltr';
  const [navigationUseCases, t] = await Promise.all([
    fetchNavigationUseCases(locale),
    getTranslations({ locale, namespace: 'navigation' }),
  ]);

  return (
    <>
      <HtmlLang locale={locale} dir={dir} />
      <a
        href="#main-content"
        className="fixed top-3 z-[60] -translate-y-24 rounded-md bg-white px-4 py-2 text-sm font-semibold text-purple-700 shadow-lg ring-2 ring-purple-600 transition-transform focus:translate-y-0 focus:outline-none ltr:left-3 rtl:right-3 dark:bg-gray-900 dark:text-purple-300 dark:ring-purple-400"
      >
        {t('skipToContent')}
      </a>
      <Navigation useCases={navigationUseCases} />
      <main id="main-content" tabIndex={-1} className="scroll-mt-16 pt-16 focus:outline-none">
        {children}
      </main>
      <Footer />
    </>
  );
}
