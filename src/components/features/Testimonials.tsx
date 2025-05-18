'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import dynamic from 'next/dynamic';
import { useTranslations, useLocale } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Create a proper loading component
const GalleryLoading = () => {
  const t = useTranslations('gallery');
  return (
    <div className="h-64">
      <LoadingSpinner size="lg" label={t('loading')} />
    </div>
  );
};

// Dynamically import Gallery with loading fallback
const Gallery = dynamic(() => import('./Gallery'), {
  loading: GalleryLoading,
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