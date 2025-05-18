import { Metadata } from 'next'
import { GalleryItem } from '@/types/gallery'
import PhotoPageClient from './PhotoPageClient';
import { getTranslations } from 'next-intl/server';
import { fetchGalleryPhotos } from '@/lib/fetcher';

interface PhotoPageProps {
  params: {
    id: string;
    locale?: string;
  }
}

// Add static generation with revalidation
export const revalidate = 3600; // Hardcoded from DEFAULT_REVALIDATE_SECONDS

// Fallback data for when the API fails
const FALLBACK_PHOTO: GalleryItem | null = null;
const FALLBACK_ADJACENT = { prev: null, next: null };

async function getPhotoData(id: string): Promise<GalleryItem | null> {
  try {
    // Use our new fetcher utility with better error handling
    const data = await fetchGalleryPhotos<GalleryItem[]>();
    const photo = data.find((item: GalleryItem) => item.id === id);
    
    if (!photo) {
      return null;
    }

    return photo;
  } catch (error) {
    console.error('Error fetching photo:', error);
    return FALLBACK_PHOTO;
  }
}

async function getAdjacentPhotos(id: string): Promise<{ prev: GalleryItem | null; next: GalleryItem | null }> {
  try {
    // Use our new fetcher utility with better error handling
    const data = await fetchGalleryPhotos<GalleryItem[]>();
    const currentIndex = data.findIndex((item: GalleryItem) => item.id === id);
    
    if (currentIndex === -1) {
      return FALLBACK_ADJACENT;
    }

    return {
      prev: currentIndex > 0 ? data[currentIndex - 1] : null,
      next: currentIndex < data.length - 1 ? data[currentIndex + 1] : null
    };
  } catch (error) {
    console.error('Error fetching adjacent photos:', error);
    return FALLBACK_ADJACENT;
  }
}

// Add generateStaticParams for key pages to pre-render at build time
export async function generateStaticParams() {
  try {
    // Use our new fetcher utility with a smaller limit
    const data = await fetchGalleryPhotos<GalleryItem[]>(1, 20);
    
    // Generate params for the most recent 20 photos
    return data.map((item: GalleryItem) => ({
      id: item.id
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

export async function generateMetadata({ params }: PhotoPageProps): Promise<Metadata> {
  const photo = await getPhotoData(params.id)
  const locale = params.locale || 'en' // Default to English if no locale is provided
  
  if (!photo) {
    return {
      title: 'Photo Not Found',
      description: 'The requested photo could not be found.',
    }
  }
  
  const title = `Professional Portrait: ${photo.prompt} | MyAIPhotoShoot`
  const description = `View this AI-generated professional portrait created with the prompt: ${photo.prompt}`
  const url = `https://myaiphotoshoot.com/${locale}/photo/${params.id}`
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [photo.public_url],
      type: 'article',
      publishedTime: photo.created_at,
      modifiedTime: photo.created_at,
      siteName: 'MyAIPhotoShoot',
      url,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [photo.public_url],
      creator: '@myaiphotoshoot',
    },
    alternates: {
      canonical: url,
    },
  }
}

export default async function PhotoPage({ params }: PhotoPageProps) {
  const photo = await getPhotoData(params.id)
  const { prev, next } = await getAdjacentPhotos(params.id)
  const locale = params.locale || 'en' // Default to English if no locale is provided
  const t = await getTranslations({ locale, namespace: 'photoPage' });

  if (!photo) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('photoNotFound')}</h1>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t('photoNotFoundDesc')}</p>
        </div>
      </div>
    )
  }

  return <PhotoPageClient photo={photo} prev={prev} next={next} locale={locale} />
} 