'use client';

import dynamic from 'next/dynamic';
import { useTranslations, useLocale } from '@/lib/utils';
import type { GalleryItem, GalleryRandomSession } from '@/types/gallery';
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
  loading: GalleryLoading
});

export default function UserGallery({
  initialItems = [],
  initialRandomSession,
}: {
  initialItems?: GalleryItem[];
  initialRandomSession?: GalleryRandomSession;
}) {
  const t = useTranslations('gallery');
  const locale = useLocale();

  return (
    <section className="bg-gradient-to-b from-white to-purple-50 py-12 dark:from-gray-900 dark:to-purple-950 md:py-16" id="gallery">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Gallery Section */}
        <div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
              {t('title')}
            </h2>
          </div>
          
          <Gallery
            key={locale}
            initialItems={initialItems}
            initialRandomSession={initialRandomSession}
          />
        </div>
      </div>
    </section>
  );
}
