import useSWR from 'swr';
import type { UseCase } from '@/types/usecase';
import { fetcher } from '@/lib/fetcher';
import { env } from '@/lib/env';

interface UseUseCaseOptions {
  slug?: string;
  locale?: string;
  fallbackData?: UseCase;
}

export function useUseCase({ slug, locale, fallbackData }: UseUseCaseOptions) {
  const searchParams = new URLSearchParams();
  if (slug) searchParams.append('slug', slug);
  if (locale) searchParams.append('locale', locale);
  const url = slug ? `${env.SUPABASE_FUNCTIONS_URL}/use-case?${searchParams.toString()}` : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR<UseCase>(
    url,
    fetcher,
    {
      // Revalidate so recent DB edits (e.g., featured_image_urls) show up immediately
      revalidateOnFocus: true,
      revalidateIfStale: true,
      revalidateOnReconnect: true,
      revalidateOnMount: true,
      refreshWhenOffline: false,
      refreshWhenHidden: false,
      fallbackData,
      dedupingInterval: 5000,
    }
  );

  return {
    useCase: data || fallbackData,
    isLoading,
    isError: !!error,
    error,
    isValidating,
    mutate
  };
}


