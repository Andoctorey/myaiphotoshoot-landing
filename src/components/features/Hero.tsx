'use client';

import { motion } from 'framer-motion';
import { useTranslations } from '@/lib/utils';

export default function Hero() {
  const t = useTranslations('hero');

  return (
    <section className="pt-24 pb-4 bg-gradient-to-b from-purple-50 to-white dark:from-purple-950 dark:to-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              {t('title')}
              <span className="text-purple-600 dark:text-purple-400"> {t('titleHighlight')}</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-4">
              {t('description')}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
} 