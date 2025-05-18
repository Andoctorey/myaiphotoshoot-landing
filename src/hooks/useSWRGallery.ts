import useSWR from 'swr';
import { GalleryItem } from '@/types/gallery';
import { fetcher } from '@/lib/fetcher';
import { env } from '@/lib/env';

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
  const url = `${env.SUPABASE_FUNCTIONS_URL}/public-gallery?page=${page}&limit=${limit}`;
  
  const { data, error, isLoading, isValidating, mutate } = useSWR<GalleryItem[]>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
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