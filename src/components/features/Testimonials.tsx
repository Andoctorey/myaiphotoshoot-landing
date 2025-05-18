'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import dynamic from 'next/dynamic';
import { useTranslations, useLocale } from '@/lib/utils';

// Dynamically import Gallery with loading fallback
const Gallery = dynamic(() => import('./Gallery'), {
  loading: () => (
    <div className="flex justify-center items-center h-64">
      <div className="animate-pulse flex space-x-4">
        <div className="h-12 w-12 bg-purple-200 dark:bg-purple-800 rounded-full"></div>
        <div className="space-y-4">
          <div className="h-4 w-36 bg-purple-200 dark:bg-purple-800 rounded"></div>
          <div className="h-4 w-24 bg-purple-200 dark:bg-purple-800 rounded"></div>
        </div>
      </div>
    </div>
  ),
  ssr: false // Disable server-side rendering as this is a client component with data fetching
});

export default function UserGallery() {
  const t = useTranslations('gallery');
  const locale = useLocale();
  const { ref: galleryRef, inView: galleryInView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section className="py-24 bg-gradient-to-b from-white to-purple-50 dark:from-gray-900 dark:to-purple-950" id="gallery">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Gallery Section */}
        <div ref={galleryRef}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={galleryInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
              {t('title')}
            </h3>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              {t('description')}
            </p>
          </motion.div>
          
          {galleryInView && <Gallery key={locale} />}
        </div>
      </div>
    </section>
  );
} 