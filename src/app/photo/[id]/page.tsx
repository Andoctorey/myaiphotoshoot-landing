import PhotoPageClient from './PhotoPageClient';
import { fetchGalleryPhotos, fetchPhotoById } from '@/lib/fetcher';
import type { GalleryItem } from '@/types/gallery';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface PhotoPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Generate dynamic metadata for social sharing
export async function generateMetadata({ params }: PhotoPageProps): Promise<Metadata> {
  const { id } = await params;
  const photo = await fetchPhotoById(id);

  if (!photo) {
    return {
      title: 'Photo Not Found - My AI Photo Shoot',
      description: 'The requested photo was not found.',
    };
  }

  // Truncate prompt if too long for social sharing
  const truncatedPrompt = photo.prompt.length > 200 
    ? photo.prompt.substring(0, 197) + '...' 
    : photo.prompt;

  const title = `My AI Photo Shoot`;
  const description = `${truncatedPrompt}`;
  const imageUrl = photo.public_url;
  const photoUrl = `https://myaiphotoshoot.com/photo/${photo.id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: photoUrl,
      siteName: 'My AI Photo Shoot',
      images: [
        {
          url: imageUrl,
          width: 1024,
          height: 1024,
          alt: photo.prompt,
          type: 'image/jpeg',
        },
      ],
      locale: 'en_US',
      type: 'article',
      publishedTime: photo.created_at,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
      creator: '@myaiphotoshoot',
      site: '@myaiphotoshoot',
    },
    // Additional meta tags for better social sharing
    other: {
      'og:image:width': '1024',
      'og:image:height': '1024',
      'twitter:image:alt': photo.prompt,
    },
  };
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
    
    console.log(`Generating static params for ${allPhotos.length} photos`);
    
    // Generate routes without locale
    return allPhotos.map((photo) => ({
      id: photo.id,
    }));
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
  const { id } = await params;
  const photo = await fetchPhotoById(id);
  const { prev, next, showNavigation } = await getAdjacentPhotos(id);
  if (!photo) return notFound();
  
  return <PhotoPageClient photo={photo} prev={prev} next={next} locale="en" showNavigation={showNavigation} />;
} 