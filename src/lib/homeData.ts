import { env } from '@/lib/env';
import type { GalleryItem } from '@/types/gallery';
import type { BlogPostsResponse, BlogListItem } from '@/types/blog';

export type HomeData = {
  initialGallery: GalleryItem[];
  initialBlog: BlogListItem[];
  initialUseCases: Array<{ slug: string; title: string; featured_image_url?: string }>;
};

export async function fetchHomeData(locale: string): Promise<HomeData> {
  let initialGallery: GalleryItem[] = [];
  let initialBlog: BlogListItem[] = [];
  let initialUseCases: Array<{ slug: string; title: string; featured_image_url?: string }> = [];

  try {
    const [gRes, bRes, uRes] = await Promise.all([
      fetch(`${env.SUPABASE_FUNCTIONS_URL}/public-gallery?page=1&limit=24`, { next: { revalidate: 3600 } }),
      fetch(`${env.SUPABASE_FUNCTIONS_URL}/blog-posts?page=1&limit=6&locale=${locale}`, { next: { revalidate: 3600 } }),
      fetch(`${env.SUPABASE_FUNCTIONS_URL}/use-cases?page=1&limit=6&locale=${locale}`, { next: { revalidate: 3600 } })
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
      initialUseCases = (useJson.items || []).map((it: any) => ({ slug: it.slug, title: it.title, featured_image_url: it.featured_image_url }));
    }
  } catch {
    // Ignore and return empty data; clients can fetch on mount
  }

  return { initialGallery, initialBlog, initialUseCases };
}



