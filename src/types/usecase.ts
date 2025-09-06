export interface UseCaseTranslation {
  title: string;
  content?: string;
  meta_title?: string;
  meta_description?: string;
}

export interface GalleryPhotoItem {
  url?: string;
  thumb_url?: string;
  prompt?: string;
  created_at?: string;
}

export interface UseCase {
  id?: string;
  slug?: string;
  status: 'draft' | 'published' | 'archived';
  featured_image_url?: string;
  gallery_photos?: GalleryPhotoItem[];
  translations?: Record<string, UseCaseTranslation>;
  created_at?: string;
  updated_at?: string;
}

