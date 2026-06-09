import { env } from '@/lib/env';
import { createDailyGalleryRandomSession } from '@/lib/galleryRandom';
import type { GalleryItem, GalleryRandomSession } from '@/types/gallery';
import type { BlogPostsResponse, BlogListItem } from '@/types/blog';

export type HomeData = {
  initialGallery: GalleryItem[];
  initialGallerySession: GalleryRandomSession;
  initialBlog: BlogListItem[];
  initialUseCases: Array<{ slug: string; title: string; featured_image_urls?: string[] }>;
};

export async function fetchHomeData(locale: string): Promise<HomeData> {
  let initialGallery: GalleryItem[] = [];
  const initialGallerySession = createDailyGalleryRandomSession();
  let initialBlog: BlogListItem[] = [];
  let initialUseCases: Array<{ slug: string; title: string; featured_image_urls?: string[] }> = [];
  const galleryParams = new URLSearchParams({
    page: '1',
    limit: '24',
    sort: 'random',
    seed: initialGallerySession.seed,
    asOf: initialGallerySession.asOf,
  });

  try {
    const [gRes, bRes, uRes] = await Promise.all([
      fetch(`${env.SUPABASE_FUNCTIONS_URL}/public-gallery?${galleryParams.toString()}`, { next: { revalidate: 3600 } }),
      fetch(`${env.SUPABASE_FUNCTIONS_URL}/blog-posts?page=1&limit=6&locale=${locale}`, { next: { revalidate: 3600 } }),
      fetch(`${env.SUPABASE_FUNCTIONS_URL}/use-cases?page=1&limit=12&locale=${locale}`, { next: { revalidate: 3600 } })
    ]);

    if (gRes.ok) {
      initialGallery = await gRes.json();
    }
    if (bRes.ok) {
      const blogJson = (await bRes.json()) as BlogPostsResponse;
      initialBlog = blogJson.posts || [];
    }
    if (uRes.ok) {
      const useJson = await uRes.json();
      type UseCaseApiItem = { slug?: string; title?: string; featured_image_urls?: unknown };
      initialUseCases = (Array.isArray(useJson.items) ? (useJson.items as UseCaseApiItem[]) : [])
        .filter((it) => typeof it?.slug === 'string' && typeof it?.title === 'string')
        .map((it) => ({
          slug: it.slug as string,
          title: it.title as string,
          featured_image_urls: Array.isArray(it.featured_image_urls) ? (it.featured_image_urls as string[]) : undefined,
        }));
    }
  } catch {
    // Ignore and return empty data; clients can fetch on mount
  }

  return { initialGallery, initialGallerySession, initialBlog, initialUseCases };
}
