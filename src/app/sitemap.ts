import { MetadataRoute } from 'next'
import { GalleryItem } from '@/types/gallery'
import { fetchGalleryPhotos } from '@/lib/fetcher'
import { locales } from '@/i18n/request'

/**
 * Sitemap generator
 * 
 * STATIC EXPORT NOTE:
 * This sitemap is generated at build time for Cloudflare Pages static hosting.
 * It fetches all photos from the database using pagination and includes all supported locales.
 */

// Add static export configuration
export const dynamic = 'force-static';
export const revalidate = 3600; // 1 hour revalidation

// API page size limit
const PAGE_SIZE = 100;

/**
 * Fetch all photos with pagination
 * Uses the gallery API with pagination to get all photos
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
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://myaiphotoshoot.com';
  
  // Generate static pages for all supported locales
  const staticPages = [
    // Root page
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    // Locale-specific home pages
    ...locales.map(locale => ({
      url: `${baseUrl}/${locale}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    })),
    // Support pages for all locales
    ...locales.map(locale => ({
      url: `${baseUrl}/${locale}/support`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];

  try {
    // Fetch all photos with complete data
    const photos = await getAllPhotos();
    
    // Create photo entries without locale prefix
    const photoEntries = photos.map((photo) => ({
      url: `${baseUrl}/photo/${photo.id}`,
      lastModified: new Date(photo.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
      images: [photo.public_url],
    }));
    
    return [...staticPages, ...photoEntries];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return just the static pages if we can't fetch photos
    return staticPages;
  }
} 