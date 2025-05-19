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

// For static export, we'll need to generate paths for all photos
export async function generateStaticParams() {
  try {
    // Fetch all gallery photos with pagination
    let allPhotos: GalleryItem[] = [];
    let currentPage = 1;
    let hasMorePhotos = true;
    const PAGE_SIZE = 100;
    
    console.log('Fetching photos for static generation...');
    
    // Continue fetching pages until we get an empty response
    while (hasMorePhotos) {
      const photos = await fetchGalleryPhotos<GalleryItem[]>(currentPage, PAGE_SIZE);
      
      if (photos.length === 0) {
        // No more photos to fetch
        hasMorePhotos = false;
      } else {
        // Add photos to our collection
        allPhotos = [...allPhotos, ...photos];
        
        // Check if we got fewer photos than the page size, meaning we've reached the end
        if (photos.length < PAGE_SIZE) {
          hasMorePhotos = false;
        } else {
          // Move to the next page
          currentPage++;
        }
      }
    }
    
    console.log(`Generating static params for ${allPhotos.length} photos across ${currentPage} pages`);
    
    // Generate routes for each locale and photo ID combination
    return locales.flatMap((locale) =>
      allPhotos.map((photo) => ({
        locale,
        id: photo.id,
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