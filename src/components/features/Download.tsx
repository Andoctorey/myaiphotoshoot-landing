'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useTranslations } from '@/lib/utils';
import PlatformButtons from './PlatformButtons';

export default function Download() {
  const t = useTranslations('download');
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section id="download" className="relative overflow-hidden bg-gradient-to-b from-white via-purple-50/40 to-gray-50 py-14 dark:from-gray-900 dark:via-purple-950/20 dark:to-gray-800 md:py-16">
      <div aria-hidden="true" className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-200/30 blur-3xl dark:bg-purple-800/15" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-purple-600 dark:bg-purple-400" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            {t('choosePlatform')}
          </h2>
        </motion.div>

        {/* Download Options */}
        <motion.div
          id="download-options"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mx-auto flex max-w-4xl flex-col items-center"
        >
          <PlatformButtons />
        </motion.div>
      </div>
    </section>
  );
}
