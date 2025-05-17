import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { GalleryItem } from '@/types/gallery'
import Script from 'next/script'
import Breadcrumb from '@/components/Breadcrumb'

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

  // Create JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    contentUrl: photo.public_url,
    description: photo.prompt,
    name: `Professional Portrait: ${photo.prompt}`,
    datePublished: photo.created_at,
    dateModified: photo.created_at,
    creator: {
      '@type': 'Organization',
      name: 'MyAIPhotoShoot',
      url: 'https://myaiphotoshoot.com'
    }
  }

  return (
    <>
      <Script
        id="photo-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Gallery', href: '/#gallery' },
              { label: 'Photo' }
            ]}
          />
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="relative aspect-square w-full">
              <Image
                src={photo.public_url}
                alt={photo.prompt}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Professional Portrait
              </h1>
              <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Prompt
                </h2>
                <p className="text-gray-700 text-lg">
                  {photo.prompt}
                </p>
              </div>
              <div className="flex justify-center">
                <Link
                  href={`https://myaiphotoshoot.com/#generate?id=${params.id}`}
                  className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 transition-colors duration-200"
                >
                  Train AI with Your Photos to Create Similar Style
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 