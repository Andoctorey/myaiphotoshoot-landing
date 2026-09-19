'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useTranslations, useLocale } from '@/lib/utils';
import { localePath } from '@/lib/seo';
import type { HomepageGalleryItem, GalleryRandomSession } from '@/types/gallery';
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
  preview = true,
}: {
  initialItems?: HomepageGalleryItem[];
  initialRandomSession?: GalleryRandomSession;
  preview?: boolean;
}) {
  const t = useTranslations('gallery');
  const tNav = useTranslations('navigation');
  const locale = useLocale();

  if (!preview) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 sm:pt-8 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm">
            <ol className="flex flex-wrap items-center gap-2 text-gray-600 dark:text-gray-300">
              <li>
                <Link href={localePath(locale, '/')} className="hover:text-primary">
                  {tNav('home')}
                </Link>
              </li>
              <li aria-hidden="true" className="text-gray-400">/</li>
              <li aria-current="page" className="text-gray-800 dark:text-gray-200">
                {t('title')}
              </li>
            </ol>
          </nav>

          <Gallery
            key={locale}
            initialItems={initialItems}
            initialRandomSession={initialRandomSession}
            preview={false}
          />
        </div>
      </div>
    );
  }

  return (
    <section className="bg-gradient-to-b from-white to-brand-50 py-12 dark:from-gray-900 dark:to-brand-950 md:py-16" id="gallery">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Gallery Section */}
        <div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">{t('title')}</h2>
            <p className="mx-auto mt-3 max-w-2xl text-gray-600 dark:text-gray-300">{t('description')}</p>
          </div>
          
          <Gallery
            key={locale}
            initialItems={initialItems}
            initialRandomSession={initialRandomSession}
            preview={preview}
          />
          <div className="mt-8 flex justify-center">
            <Link
              href={localePath(locale, '/gallery/')}
              className="inline-flex justify-center rounded-full bg-primary px-8 py-4 font-bold text-on-primary transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {t('exploreMore')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
