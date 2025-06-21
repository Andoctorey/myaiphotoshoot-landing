import PhotoPageClient from './PhotoPageClient';
import { fetchGalleryPhotos, fetchPhotoById } from '@/lib/fetcher';
import type { GalleryItem } from '@/types/gallery';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface PhotoPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Generate dynamic metadata for social sharing
export async function generateMetadata({ params }: PhotoPageProps): Promise<Metadata> {
  const { id } = await params;
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

  // Extract keywords from prompt for better SEO
  const extractKeywords = (prompt: string): string => {
    const cleaned = cleanPromptForTitle(prompt);
    const words = cleaned.toLowerCase().split(/[\s,]+/);
    
    // Common searchable terms
    const keywordCategories = [
      'portrait', 'photo', 'picture', 'headshot', 'selfie',
      'woman', 'man', 'person', 'model', 'character',
      'professional', 'artistic', 'creative', 'vintage', 'modern',
      'studio', 'outdoor', 'nature', 'urban', 'fantasy',
      'dramatic', 'elegant', 'vibrant', 'beautiful', 'stunning'
    ];
    
    const foundKeywords = words.filter(word => 
      keywordCategories.includes(word) || word.length > 4
    ).slice(0, 10);
    
    // Always include AI-related keywords
    const aiKeywords = ['AI photo', 'AI generated', 'AI portrait', 'artificial intelligence'];
    
    return [...aiKeywords, ...foundKeywords].join(', ');
  };

  // Create title from cleaned prompt
  const createTitle = (prompt: string): string => {
    const cleaned = cleanPromptForTitle(prompt);
    
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
  const keywords = extractKeywords(photo.prompt);
  const imageUrl = photo.public_url;
  const photoUrl = `https://myaiphotoshoot.com/photo/${photo.id}`;

  return {
    title,
    description,
    keywords,
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
          type: 'image/jpeg',
        },
      ],
      locale: 'en_US',
      type: 'article',
      publishedTime: photo.created_at,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
      creator: '@myaiphotoshoot',
      site: '@myaiphotoshoot',
    },
  };
}

// For static export, we'll need to generate paths for all photos
export async function generateStaticParams() {
  try {
    // Fetch all gallery photos with pagination
    let allPhotos: GalleryItem[] = [];
    let currentPage = 1;
    let hasMorePhotos = true;
    const PAGE_SIZE = 100;
    
    console.log('Fetching photos for static generation...');
    
    // Continue fetching pages until we get an empty response
    while (hasMorePhotos) {
      const photos = await fetchGalleryPhotos<GalleryItem[]>(currentPage, PAGE_SIZE);
      
      if (photos.length === 0) {
        // No more photos to fetch
        hasMorePhotos = false;
      } else {
        // Add photos to our collection
        allPhotos = [...allPhotos, ...photos];
        
        // Check if we got fewer photos than the page size, meaning we've reached the end
        if (photos.length < PAGE_SIZE) {
          hasMorePhotos = false;
        } else {
          // Move to the next page
          currentPage++;
        }
      }
    }
    
    console.log(`Generating static params for ${allPhotos.length} photos`);
    
    // Generate routes without locale
    return allPhotos.map((photo) => ({
      id: photo.id,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
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
  const { id } = await params;
  const photo = await fetchPhotoById(id);
  const { prev, next, showNavigation } = await getAdjacentPhotos(id);
  if (!photo) return notFound();
  
  return <PhotoPageClient photo={photo} prev={prev} next={next} locale="en" showNavigation={showNavigation} />;
} 