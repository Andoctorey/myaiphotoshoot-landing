import HtmlLang from '@/components/layout/HtmlLang';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import { isRTLLanguage } from '@/lib/utils';

type Props = {
  locale: string;
  children: React.ReactNode;
};

export default function SiteShell({ locale, children }: Props) {
  const dir: 'ltr' | 'rtl' = isRTLLanguage(locale) ? 'rtl' : 'ltr';
  return (
    <>
      <HtmlLang locale={locale} dir={dir} />
      <Navigation />
      <main className="pt-20 md:pt-24">{children}</main>
      <Footer />
    </>
  );
}


