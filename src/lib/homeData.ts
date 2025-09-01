import { env } from '@/lib/env';
import type { GalleryItem } from '@/types/gallery';
import type { BlogPostsResponse, BlogListItem } from '@/types/blog';

export type HomeData = {
  initialGallery: GalleryItem[];
  initialBlog: BlogListItem[];
};

export async function fetchHomeData(locale: string): Promise<HomeData> {
  let initialGallery: GalleryItem[] = [];
  let initialBlog: BlogListItem[] = [];

  try {
    const [gRes, bRes] = await Promise.all([
      fetch(`${env.SUPABASE_FUNCTIONS_URL}/public-gallery?page=1&limit=24`, { next: { revalidate: 3600 } }),
      fetch(`${env.SUPABASE_FUNCTIONS_URL}/blog-posts?page=1&limit=6&locale=${locale}`, { next: { revalidate: 3600 } })
    ]);

    if (gRes.ok) {
      initialGallery = await gRes.json();
    }
    if (bRes.ok) {
      const blogJson = (await bRes.json()) as BlogPostsResponse;
      initialBlog = blogJson.posts || [];
    }
  } catch {
    // Ignore and return empty data; clients can fetch on mount
  }

  return { initialGallery, initialBlog };
}



