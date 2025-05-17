import { Metadata } from 'next'
import { GalleryItem } from '@/types/gallery'
import PhotoPageClient from './PhotoPageClient'

interface PhotoPageProps {
  params: {
    id: string
  }
}

async function getPhotoData(id: string): Promise<GalleryItem | null> {
  try {
    const response = await fetch(`https://trzgfajvyjpvbqedyxug.supabase.co/functions/v1/public-gallery?page=1&limit=100`, {
      next: { revalidate: 3600 } // Revalidate every hour
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch gallery data');
    }

    const data = await response.json();
    const photo = data.find((item: GalleryItem) => item.id === id);
    
    if (!photo) {
      return null;
    }

    return photo;
  } catch (error) {
    console.error('Error fetching photo:', error);
    return null;
  }
}

async function getAdjacentPhotos(id: string): Promise<{ prev: GalleryItem | null; next: GalleryItem | null }> {
  try {
    const response = await fetch(`https://trzgfajvyjpvbqedyxug.supabase.co/functions/v1/public-gallery?page=1&limit=100`, {
      next: { revalidate: 3600 }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch gallery data');
    }

    const data = await response.json();
    const currentIndex = data.findIndex((item: GalleryItem) => item.id === id);
    
    if (currentIndex === -1) {
      return { prev: null, next: null };
    }

    return {
      prev: currentIndex > 0 ? data[currentIndex - 1] : null,
      next: currentIndex < data.length - 1 ? data[currentIndex + 1] : null
    };
  } catch (error) {
    console.error('Error fetching adjacent photos:', error);
    return { prev: null, next: null };
  }
}

export async function generateMetadata({ params }: PhotoPageProps): Promise<Metadata> {
  const photo = await getPhotoData(params.id)
  
  if (!photo) {
    return {
      title: 'Photo Not Found',
      description: 'The requested photo could not be found.',
    }
  }
  
  const title = `Professional Portrait: ${photo.prompt} | MyAIPhotoShoot`
  const description = `View this AI-generated professional portrait created with the prompt: ${photo.prompt}`
  
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
      url: `https://myaiphotoshoot.com/photo/${params.id}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [photo.public_url],
      creator: '@myaiphotoshoot',
    },
    alternates: {
      canonical: `https://myaiphotoshoot.com/photo/${params.id}`,
    },
  }
}

export default async function PhotoPage({ params }: PhotoPageProps) {
  const photo = await getPhotoData(params.id)
  const { prev, next } = await getAdjacentPhotos(params.id)

  if (!photo) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900">Photo Not Found</h1>
          <p className="mt-4 text-gray-600">The requested photo could not be found.</p>
        </div>
      </div>
    )
  }

  return <PhotoPageClient photo={photo} prev={prev} next={next} />
} 