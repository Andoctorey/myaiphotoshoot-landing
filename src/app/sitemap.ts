import { MetadataRoute } from 'next'
import { GalleryItem } from '@/types/gallery'
import { fetchGalleryPhotos } from '@/lib/fetcher'

/**
 * Sitemap generator
 * 
 * STATIC EXPORT NOTE:
 * This sitemap is generated at build time for Cloudflare Pages static hosting.
 * It fetches all gallery photos shown on the homepage.
 * For external photos not in the gallery, the pages will be generated based on individual access.
 */

// Add static export configuration
export const dynamic = 'force-static';
export const revalidate = 3600; // 1 hour revalidation

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
    url: `${baseUrl}/en/photo/${photo.id}`,
    lastModified: new Date(photo.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
    images: [photo.public_url],
  }));

  return [...staticPages, ...photoPages];
} 