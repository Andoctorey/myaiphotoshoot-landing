import PhotoPageClient from './PhotoPageClient';
import { fetchGalleryPhotos, fetchPhotoById } from '@/lib/fetcher';
import type { GalleryItem } from '@/types/gallery';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { env } from '@/lib/env';

interface PhotoPageProps {
  params: {
    id: string;
  };
}

// Generate dynamic metadata for social sharing
export async function generateMetadata({ params }: PhotoPageProps): Promise<Metadata> {
  const { id } = params;
  const photo = await fetchPhotoById(id);

  if (!photo) {
    return {
      title: 'Photo Not Found - My AI Photo Shoot',
      description: 'The requested photo was not found.',
    };
  }

  // Clean and truncate prompt for title (Google recommends ~60 chars)
  const cleanPromptForTitle = (prompt: string): string => {
    return prompt
      // Remove technical terms that don't help with search
      .replace(/\b(ultra-detailed|high-resolution|4k|8k|raw|dslr|professional lighting|cinematic lighting)\b/gi, '')
      // Clean up extra spaces
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Removed meta keywords generator (not used by modern search engines)

  // Create title from cleaned prompt
  const createTitle = (prompt: string): string => {
    const cleaned = cleanPromptForTitle(prompt);
    
    // Handle very short prompts
    if (cleaned.length <= 10) {
      return `AI Generated ${cleaned} | My AI Photo Shoot`;
    }
    
    // If prompt is short enough, use it directly
    if (cleaned.length <= 45) {
      return `${cleaned} | My AI Photo Shoot`;
    }
    
    // Otherwise, truncate at a natural break
    const truncated = cleaned.substring(0, 45);
    const lastSpace = truncated.lastIndexOf(' ');
    const cutPoint = lastSpace > 30 ? lastSpace : 45;
    
    return `${cleaned.substring(0, cutPoint)}... | My AI Photo Shoot`;
  };

  // Use prompt as description with minimal cleanup
  const createDescription = (prompt: string): string => {
    const cleaned = prompt
      // Only remove the most technical terms that confuse general users
      .replace(/\b(ultra-detailed|high-resolution|4k|8k|raw|dslr)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Add AI context prefix and keep it under 155 characters
    const prefix = 'AI-generated photo: ';
    const available = 155 - prefix.length;
    
    if (cleaned.length <= available) {
      return prefix + cleaned;
    }
    
    // Truncate at natural break
    const truncated = cleaned.substring(0, available - 3);
    const lastPeriod = truncated.lastIndexOf('.');
    const lastComma = truncated.lastIndexOf(',');
    const cutPoint = Math.max(lastPeriod, lastComma);
    
    if (cutPoint > available * 0.7) {
      return prefix + cleaned.substring(0, cutPoint + 1);
    }
    
    return prefix + truncated + '...';
  };

  const title = createTitle(photo.prompt);
  const description = createDescription(photo.prompt);
  const imageUrl = photo.public_url;
  const photoUrl = `https://myaiphotoshoot.com/photo/${photo.id}/`;

  // Infer MIME type for OG image from URL
  const inferMimeFromUrl = (url: string): string | undefined => {
    try {
      const cleanUrl = url.split('?')[0];
      const ext = cleanUrl.substring(cleanUrl.lastIndexOf('.') + 1).toLowerCase();
      if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
      if (ext === 'png') return 'image/png';
      if (ext === 'webp') return 'image/webp';
      if (ext === 'gif') return 'image/gif';
      return undefined;
    } catch {
      return undefined;
    }
  };
  const ogImageType = inferMimeFromUrl(imageUrl);

  return {
    title,
    description,
    authors: [{ name: 'My AI Photo Shoot', url: 'https://myaiphotoshoot.com' }],
    creator: 'My AI Photo Shoot',
    publisher: 'My AI Photo Shoot',
    category: 'AI Photography',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: photoUrl,
    },
    openGraph: {
      title,
      description,
      url: photoUrl,
      siteName: 'My AI Photo Shoot',
      images: [
        {
          url: imageUrl,
          width: 1024,
          height: 1024,
          alt: photo.prompt,
          ...(ogImageType ? { type: ogImageType } : {}),
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

// Generate static params for all public photos
export async function generateStaticParams() {
  try {
    const allParams: { id: string }[] = [];
    let currentPage = 1;
    let hasMorePhotos = true;
    
    // Fetch all public photos for static generation
    while (hasMorePhotos) {
      const response = await fetch(
        `${env.SUPABASE_FUNCTIONS_URL}/public-gallery?page=${currentPage}&limit=100`,
        { next: { revalidate: 3600 } }
      );
      
      if (!response.ok) {
        console.warn(`Failed to fetch photos for page ${currentPage}:`, response.status);
        break;
      }
      
      const photos = await response.json();
      
      if (photos.length === 0) {
        hasMorePhotos = false;
      } else {
        // Add params for each photo
        photos.forEach((photo: { id: string }) => {
          if (photo.id) {
            allParams.push({
              id: photo.id,
            });
          }
        });
        
        if (photos.length < 100) {
          hasMorePhotos = false;
        } else {
          currentPage++;
        }
      }
    }
    
    return allParams;
    
  } catch (error) {
    console.error('Error generating static params for photos:', error);
    return [];
  }
}

async function getAdjacentPhotos(id: string): Promise<{ prev: GalleryItem | null; next: GalleryItem | null; showNavigation: boolean }> {
  try {
    const data = await fetchGalleryPhotos<GalleryItem[]>();
    const currentIndex = data.findIndex((item) => item.id === id);
    
    // If photo not found in gallery data, hide navigation
    if (currentIndex === -1) {
      return {
        prev: null,
        next: null,
        showNavigation: false
      };
    }
    
    return {
      prev: currentIndex > 0 ? data[currentIndex - 1] : null,
      next: currentIndex < data.length - 1 ? data[currentIndex + 1] : null,
      showNavigation: true
    };
  } catch (error) {
    console.error('Failed to fetch adjacent photos:', error);
    return {
      prev: null,
      next: null,
      showNavigation: false
    };
  }
}

export default async function PhotoPage({ params }: PhotoPageProps) {
  const { id } = params;
  const photo = await fetchPhotoById(id);
  const { prev, next, showNavigation } = await getAdjacentPhotos(id);
  if (!photo) return notFound();
  
  return <PhotoPageClient photo={photo} prev={prev} next={next} locale="en" showNavigation={showNavigation} />;
} 