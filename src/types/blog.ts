export interface BlogPhoto {
  url: string;
  alt?: string;
  caption?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  photo_topics: string | null;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
  slug: string | null;
  meta_description: string | null;
  featured_image_url: string | null;
  section_photos: Record<string, BlogPhoto | BlogPhoto[]> | null;
  translations: Record<string, BlogTranslation>;
}

export interface BlogListItem {
  id: string;
  title: string;
  slug: string | null;
  meta_description: string | null;
  featured_image_url: string | null;
  created_at: string;
}

export interface BlogPostsResponse {
  posts: BlogListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Blog translation interface
export interface BlogTranslation {
  title?: string;
  content?: string;
  meta_description?: string;
}

// Blog metadata for SEO
export interface BlogMetadata {
  title: string;
  description: string;
  image?: string;
  url: string;
  publishedAt: string;
  updatedAt: string;
}

// Blog navigation item
export interface BlogNavItem {
  title: string;
  slug: string;
  publishedAt: string;
} 