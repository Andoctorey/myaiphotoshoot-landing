export interface UseCaseTranslation {
  title: string;
  content?: string;
  meta_title?: string;
  meta_description?: string;
  benefits?: string[];
  faqs?: Array<{ q: string; a: string }>;
  sections?: Array<{ heading: string; body: string[] }>;
}

export interface GalleryPhotoItem {
  id?: string;
  url?: string;
  thumb_url?: string;
  prompt?: string;
  created_at?: string;
}

export interface UseCase {
  id?: string;
  slug?: string;
  status: 'draft' | 'published' | 'archived';
  featured_image_urls?: string[];
  gallery_photos?: GalleryPhotoItem[];
  translations?: Record<string, UseCaseTranslation>;
  benefits?: string[];
  faqs?: Array<{ q: string; a: string }>;
  sections?: Array<{ heading: string; body: string[] }>;
  created_at?: string;
  updated_at?: string;
}

