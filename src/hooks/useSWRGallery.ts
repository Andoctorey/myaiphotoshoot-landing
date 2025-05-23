import useSWR from 'swr';
import { GalleryItem } from '@/types/gallery';
import { fetcher } from '@/lib/fetcher';
import { env } from '@/lib/env';

/**
 * Gallery data hook using SWR
 * 
 * STATIC EXPORT NOTE:
 * Since we're using Cloudflare Pages static hosting without server components,
 * all data fetching happens client-side using SWR. This hook fetches gallery
 * data directly from Supabase rather than using server-rendered API routes.
 */

interface UseGalleryOptions {
  page?: number;
  limit?: number;
  fallbackData?: GalleryItem[];
}

export function useGallery({ 
  page = 1, 
  limit = 100,
  fallbackData = []
}: UseGalleryOptions = {}) {
  // Direct fetch from Supabase Function URL for static Cloudflare Pages deployment
  const url = `${env.SUPABASE_FUNCTIONS_URL}/public-gallery?page=${page}&limit=${limit}`;
  
  const { data, error, isLoading, isValidating, mutate } = useSWR<GalleryItem[]>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      revalidateOnReconnect: false,
      refreshWhenOffline: false,
      refreshWhenHidden: false,
      fallbackData,
      dedupingInterval: 3600000, // 1 hour in milliseconds
    }
  );

  return {
    gallery: data || [],
    isLoading,
    isError: !!error,
    error,
    isValidating,
    mutate
  };
} 