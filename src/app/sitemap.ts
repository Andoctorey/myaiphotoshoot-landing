import { MetadataRoute } from 'next'
import { GalleryItem } from '@/types/gallery'
import { fetchGalleryPhotos } from '@/lib/fetcher'

/**
 * Sitemap generator
 * 
 * STATIC EXPORT NOTE:
 * This sitemap is generated at build time for Cloudflare Pages static hosting.
 * It fetches all gallery photos with pagination to handle any number of photos.
 */

// Add static export configuration
export const dynamic = 'force-static';
export const revalidate = 3600; // 1 hour revalidation

// Fallback data for when the API fails
const FALLBACK_PHOTOS: GalleryItem[] = [];

// API page size limit
const PAGE_SIZE = 100;

/**
 * Fetch all photos with pagination
 * Handles the API's limit of 100 items per page
 */
async function getAllPhotos(): Promise<GalleryItem[]> {
  try {
    let allPhotos: GalleryItem[] = [];
    let currentPage = 1;
    let hasMorePhotos = true;
    
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
    
    console.log(`Sitemap: Fetched ${allPhotos.length} total photos across ${currentPage} pages`);
    return allPhotos;
    
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