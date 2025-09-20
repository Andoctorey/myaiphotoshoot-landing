'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useTranslations } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { trackEventAndNavigate } from '@/lib/analytics';

export default function Footer() {
  const t = useTranslations('footer');
  const tBlog = useTranslations('blog');
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'en';
  
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <footer className="bg-gray-900 text-white py-12" role="contentinfo" aria-label="Site footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start"
        >
          {/* Main Brand Section */}
          <div>
            <h3 className="text-xl font-bold mb-4">{t('title')}</h3>
            <p className="text-gray-400 mb-6 leading-relaxed">
              {t('description')}
            </p>
            <a
              href="https://app.myaiphotoshoot.com"
              className="group inline-flex w-full sm:w-auto items-center justify-center px-5 py-2.5 text-sm font-medium text-white/90 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-sm transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={tBlog('cta.button')}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                e.preventDefault();
                trackEventAndNavigate('webapp_cta_click', 'https://app.myaiphotoshoot.com');
              }}
            >
              <span>{tBlog('cta.button')}</span>
              <svg
                className="ml-2 h-4 w-4 text-white/80 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none"
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
                  href={`/${locale}/legal`} 
                  className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-sm p-1 block"
                >
                  {t('legal')}
                </Link>
              </li>
              <li>
                <a 
                  href="https://github.com/Andoctorey/myaiphotoshoot-kmp" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-sm p-1 block"
                  aria-label={`${t('openSource')} (opens in new tab)`}
                >
                  {t('openSource')}
                </a>
              </li>
              <li>
                <a 
                  href="https://x.com/andoctorey" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-sm p-1 block"
                  aria-label={`${t('twitter')} (opens in new tab)`}
                >
                  {t('twitter')}
                </a>
              </li>
              <li>
                <Link 
                  href={`/${locale}/support`} 
                  className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-sm p-1 block"
                >
                  {t('support')}
                </Link>
              </li>
            </ul>
          </div>
        </motion.div>

        <div className="mt-12 pt-8 border-t border-gray-800">
          <p className="text-center text-gray-400 text-sm">
            {t('copyright').replace(/20\d{2}/, `${new Date().getFullYear()}`)}
          </p>
        </div>
      </div>
    </footer>
  );
} 