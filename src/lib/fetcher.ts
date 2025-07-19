import { env } from '@/lib/env';
import type { GalleryItem } from '@/types/gallery';

/**
 * Fetcher function for SWR
 * @param url The URL to fetch data from
 * @returns The JSON response
 */
export const fetcher = async <T>(url: string): Promise<T> => {
  // Add timeout to prevent hanging requests
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
};

/**
 * Fetch gallery photos with error handling
 * @param page Page number
 * @param limit Items per page
 * @returns Array of gallery items
 */
export async function fetchGalleryPhotos<T>(page = 1, limit = 100): Promise<T> {
  const url = `${env.SUPABASE_FUNCTIONS_URL}/public-gallery?page=${page}&limit=${limit}`;
  return fetcher<T>(url);
}

/**
 * Fetch a single photo by ID
 * @param id Photo ID
 * @returns Gallery item or null if not found
 */
export async function fetchPhotoById(id: string): Promise<GalleryItem | null> {
  try {
    const url = `${env.SUPABASE_FUNCTIONS_URL}/get-generation?id=${id}`;
    return await fetcher<GalleryItem>(url);
  } catch (error) {
    console.error('Failed to fetch photo data:', error);
    return null;
  }
} 