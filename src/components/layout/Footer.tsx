'use client';

import { useTranslations } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { trackEventAndNavigate } from '@/lib/analytics';
import { locales } from '@/i18n/request';
import { localePath } from '@/lib/seo';
import { usePlatformAppLink } from '@/hooks/usePlatformAppLink';

export default function Footer() {
  const t = useTranslations('footer');
  const tBlog = useTranslations('blog');
  const tNav = useTranslations('navigation');
  const pathname = usePathname();
  const appLink = usePlatformAppLink();
  const firstPathSegment = pathname?.split('/')[1] || '';
  const locale = locales.includes(firstPathSegment as (typeof locales)[number]) ? firstPathSegment : 'en';

  return (
    <footer className="bg-gray-900 text-white py-12" role="contentinfo" aria-label="Site footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {/* Main Brand Section */}
          <div>
            <h3 className="text-xl font-bold mb-4">{t('title')}</h3>
            <p className="text-gray-400 mb-6 leading-relaxed">
              {t('description')}
            </p>
            <a
              href={appLink.url}
              className="group inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-purple-950/30 transition-all duration-200 hover:-translate-y-0.5 hover:from-purple-500 hover:to-indigo-500 hover:shadow-xl hover:shadow-purple-950/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 motion-reduce:transform-none sm:w-auto"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={tBlog('cta.button')}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                e.preventDefault();
                trackEventAndNavigate(appLink.event, appLink.url);
              }}
            >
              <span>{tBlog('cta.button')}</span>
              <svg
                className="ml-2 h-5 w-5 text-white transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 11-1.414-1.414L13.586 11H4a1 1 0 110-2h9.586l-3.293-3.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </a>
          </div>

          {/* Links Section */}
          <div className="md:text-right">

            <ul className="space-y-2">
              <li>
                <Link
                  href={localePath(locale, '/presets/')}
                  className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-sm p-1 block"
                >
                  {tNav('presets')}
                </Link>
              </li>
              <li>
                <Link
                  href={localePath(locale, '/models/')}
                  className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-sm p-1 block"
                >
                  {tNav('models')}
                </Link>
              </li>
              <li>
                <Link
                  href={localePath(locale, '/legal/')}
                  className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-sm p-1 block"
                >
                  {t('legal')}
                </Link>
              </li>
              <li>
                <a
                  href="https://x.com/andoctorey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-sm p-1 block"
                  aria-label={`${t('twitter')} (${t('opensInNewTab')})`}
                >
                  {t('twitter')}
                </a>
              </li>
              <li>
                <Link
                  href={localePath(locale, '/support/')}
                  className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-sm p-1 block"
                >
                  {t('support')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800">
          <p className="text-center text-gray-400 text-sm">
            {t('copyright').replace(/20\d{2}/, `${new Date().getFullYear()}`)}
          </p>
        </div>
      </div>
    </footer>
  );
}
