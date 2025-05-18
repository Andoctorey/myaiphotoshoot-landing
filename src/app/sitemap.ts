import { MetadataRoute } from 'next'
import { GalleryItem } from '@/types/gallery'
import { fetchGalleryPhotos } from '@/lib/fetcher'

// Fallback data for when the API fails
const FALLBACK_PHOTOS: GalleryItem[] = [];

async function getAllPhotos(): Promise<GalleryItem[]> {
  try {
    // Use our new fetcher utility with better error handling
    return await fetchGalleryPhotos<GalleryItem[]>();
  } catch (error) {
    console.error('Error fetching photos for sitemap:', error);
    return FALLBACK_PHOTOS;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const photos = await getAllPhotos();
  const baseUrl = 'https://myaiphotoshoot.com';

  // Add static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
  ];

  // Add dynamic photo pages with their images
  const photoPages = photos.map((photo) => ({
    url: `${baseUrl}/photo/${photo.id}`,
    lastModified: new Date(photo.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
    images: [photo.public_url],
  }));

  return [...staticPages, ...photoPages];
} 