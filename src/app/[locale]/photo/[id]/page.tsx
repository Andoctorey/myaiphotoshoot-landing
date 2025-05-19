import PhotoPageClient from '@/app/photo/[id]/PhotoPageClient';
import { locales } from '@/i18n/request';
import { fetchGalleryPhotos, fetchPhotoById } from '@/lib/fetcher';
import type { GalleryItem } from '@/types/gallery';
import { notFound } from 'next/navigation';

interface PhotoPageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

// For static export, we'll need to generate paths for all photos in the gallery
// and handle non-gallery photos with client-side fallbacks
export async function generateStaticParams() {
  try {
    // Fetch all gallery photos to include in static export
    const data = await fetchGalleryPhotos<GalleryItem[]>();
    
    return locales.flatMap((locale) =>
      data.map((item: GalleryItem) => ({
        locale,
        id: item.id,
      }))
    );
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

async function getAdjacentPhotos(id: string): Promise<{ prev: GalleryItem | null; next: GalleryItem | null; showNavigation: boolean }> {
  try {
    const data = await fetchGalleryPhotos<GalleryItem[]>();
    const currentIndex = data.findIndex((item) => item.id === id);
    
    // If photo not found in gallery data, hide navigation
    if (currentIndex === -1) {
      return {
        prev: null,
        next: null,
        showNavigation: false
      };
    }
    
    return {
      prev: currentIndex > 0 ? data[currentIndex - 1] : null,
      next: currentIndex < data.length - 1 ? data[currentIndex + 1] : null,
      showNavigation: true
    };
  } catch (error) {
    console.error('Failed to fetch adjacent photos:', error);
    return {
      prev: null,
      next: null,
      showNavigation: false
    };
  }
}

export default async function PhotoPage({ params }: PhotoPageProps) {
  const { id, locale } = await params;
  const photo = await fetchPhotoById(id);
  const { prev, next, showNavigation } = await getAdjacentPhotos(id);
  if (!photo) return notFound();
  return <PhotoPageClient photo={photo} prev={prev} next={next} locale={locale} showNavigation={showNavigation} />;
} 