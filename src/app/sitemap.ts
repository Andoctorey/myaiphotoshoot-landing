import { MetadataRoute } from 'next'
import { GalleryItem } from '@/types/gallery'
import { env } from '@/lib/env'

async function getAllPhotos(): Promise<GalleryItem[]> {
  try {
    const response = await fetch(
      `${env.SUPABASE_FUNCTIONS_URL}/public-gallery?page=1&limit=100`,
      { next: { revalidate: 3600 } } // Revalidate every hour
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch gallery data');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching photos for sitemap:', error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const photos = await getAllPhotos();
  const baseUrl = 'https://myaiphotoshoot.com';

  // Add static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
  ];

  // Add dynamic photo pages with their images
  const photoPages = photos.map((photo) => ({
    url: `${baseUrl}/photo/${photo.id}`,
    lastModified: new Date(photo.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
    images: [photo.public_url],
  }));

  return [...staticPages, ...photoPages];
} 