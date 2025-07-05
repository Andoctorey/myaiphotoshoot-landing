import useSWR from 'swr';
import { BlogPost, BlogPostsResponse } from '@/types/blog';
import { fetcher } from '@/lib/fetcher';
import { env } from '@/lib/env';

/**
 * Blog posts list hook using SWR
 * 
 * STATIC EXPORT NOTE:
 * Since we're using Cloudflare Pages static hosting without server components,
 * all data fetching happens client-side using SWR. This hook fetches blog
 * data directly from Supabase rather than using server-rendered API routes.
 */

interface UseBlogPostsOptions {
  page?: number;
  limit?: number;
  locale?: string;
  fallbackData?: BlogPostsResponse;
}

export function useBlogPosts({ 
  page = 1, 
  limit = 10,
  locale,
  fallbackData
}: UseBlogPostsOptions = {}) {
  // Build URL with query parameters
  const searchParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  
  if (locale) {
    searchParams.append('locale', locale);
  }
  
  const url = `${env.SUPABASE_FUNCTIONS_URL}/blog-posts?${searchParams.toString()}`;
  
  const { data, error, isLoading, isValidating, mutate } = useSWR<BlogPostsResponse>(
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
    data: data || fallbackData,
    posts: data?.posts || [],
    pagination: data ? {
      total: data.total,
      page: data.page,
      limit: data.limit,
      totalPages: data.totalPages,
    } : null,
    isLoading,
    isError: !!error,
    error,
    isValidating,
    mutate
  };
}

/**
 * Single blog post hook using SWR
 */

interface UseBlogPostOptions {
  slug?: string;
  id?: string;
  locale?: string;
  fallbackData?: BlogPost;
}

export function useBlogPost({ 
  slug, 
  id, 
  locale,
  fallbackData
}: UseBlogPostOptions) {
  // Build URL with query parameters
  const searchParams = new URLSearchParams();
  
  if (slug) {
    searchParams.append('slug', slug);
  } else if (id) {
    searchParams.append('id', id);
  }
  
  if (locale) {
    searchParams.append('locale', locale);
  }
  
  const url = (slug || id) ? `${env.SUPABASE_FUNCTIONS_URL}/blog-post?${searchParams.toString()}` : null;
  
  // Debug logging
  console.log('useBlogPost hook:', { slug, id, locale, url });
  
  const { data, error, isLoading, isValidating, mutate } = useSWR<BlogPost>(
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
    post: data || fallbackData,
    isLoading,
    isError: !!error,
    error,
    isValidating,
    mutate
  };
} 