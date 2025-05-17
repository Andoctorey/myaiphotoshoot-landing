'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useTranslations } from '@/lib/utils';

export default function Footer() {
  const t = useTranslations('footer');
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-xl font-bold mb-4">{t('title')}</h3>
            <p className="text-gray-400 mb-4">
              {t('description')}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
              {t('links')}
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="/legal" className="text-gray-400 hover:text-white transition-colors">
                  {t('legal')}
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com/Andoctorey/myaiphotoshoot.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {t('openSource')}
                </a>
              </li>
              <li>
                <a 
                  href="https://x.com/andoctorey" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {t('twitter')}
                </a>
              </li>
              <li>
                <a 
                  href="https://twitter.com/messages/compose?recipient_id=2884868299" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {t('support')}
                </a>
              </li>
            </ul>
          </div>
        </motion.div>

        <div className="mt-12 pt-8 border-t border-gray-800">
          <p className="text-center text-gray-400 text-sm">
            {t('copyright').replace('2023', new Date().getFullYear().toString())}
          </p>
        </div>
      </div>
    </footer>
  );
} 