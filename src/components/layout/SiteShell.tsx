import HtmlLang from '@/components/layout/HtmlLang';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import { isRTLLanguage } from '@/lib/utils';
import { fetchNavigationUseCases } from '@/lib/navigationUseCases';

type Props = {
  locale: string;
  children: React.ReactNode;
};

export default async function SiteShell({ locale, children }: Props) {
  const dir: 'ltr' | 'rtl' = isRTLLanguage(locale) ? 'rtl' : 'ltr';
  const navigationUseCases = await fetchNavigationUseCases(locale);

  return (
    <>
      <HtmlLang locale={locale} dir={dir} />
      <Navigation useCases={navigationUseCases} />
      <main className="pt-16">{children}</main>
      <Footer />
    </>
  );
}
