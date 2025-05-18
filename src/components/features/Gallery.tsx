'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { GalleryItem } from '@/types/gallery';
import { useRouter, usePathname } from 'next/navigation';
import { LoadingSpinner, ButtonSpinner } from '@/components/ui/LoadingSpinner';
import { useGallery } from '@/hooks/useSWRGallery';

export default function Gallery() {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [displayCount, setDisplayCount] = useState<number>(20); // Default to 20 items (4 rows on desktop)
  const fetchAttemptedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  
  // Extract locale from pathname (first segment)
  const locale = pathname.split('/')[1];
  
  // Use SWR hook for fetching gallery data
  const { gallery, isLoading, isError, error, mutate } = useGallery({ 
    page: 1, 
    limit: 24,
  });

  // Update local state when gallery data changes from SWR
  useEffect(() => {
    if (gallery.length > 0) {
      setGalleryItems(prevItems => {
        if (page === 1) {
          return gallery;
        } else {
          const newItems = gallery.filter(
            (newItem: GalleryItem) => !prevItems.some((prevItem) => prevItem.id === newItem.id)
          );
          return [...prevItems, ...newItems];
        }
      });
      
      if (gallery.length < 24) {
        setHasMore(false);
      }
    }
  }, [gallery, page]);

  // Unified function to fetch more gallery items for pagination
  const fetchMoreGalleryItems = async (pageNumber: number) => {
    if (isLoading) return;

    try {
      // Use the API route with ISR
      const response = await fetch(`/${locale}/gallery-data?page=${pageNumber}&limit=24`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch gallery items');
      }
      
      const data = await response.json();
      
      if (data.length === 0) {
        setHasMore(false);
      } else {
        // For pagination, append to existing items
        setGalleryItems((prevItems) => {
          const newItems = data.filter(
            (newItem: GalleryItem) => !prevItems.some((prevItem) => prevItem.id === newItem.id)
          );
          return [...prevItems, ...newItems];
        });
        
        // Increment page for next fetch
        setPage(pageNumber + 1);
        
        // Reset fetch attempt flag so we can fetch again if needed
        fetchAttemptedRef.current = false;
      }
    } catch (error) {
      console.error('Error fetching more gallery items:', error);
    }
  };

  // Set initial display count based on screen size
  useEffect(() => {
    function updateDisplayCount() {
      // Default to desktop: 5 columns x 4 rows = 20 items
      let initialCount = 20;
      
      // Adjust based on viewport width
      if (window.innerWidth < 640) {
        // Mobile: 2 columns x 4 rows = 8 items
        initialCount = 8;
      } else if (window.innerWidth < 768) {
        // Small tablet: 3 columns x 4 rows = 12 items
        initialCount = 12;
      } else if (window.innerWidth < 1024) {
        // Tablet: 4 columns x 4 rows = 16 items
        initialCount = 16;
      }
      
      setDisplayCount(initialCount);
    }
    
    // Call initially
    updateDisplayCount();
    
    // Add resize listener
    window.addEventListener('resize', updateDisplayCount);
    return () => window.removeEventListener('resize', updateDisplayCount);
  }, []);

  // Ensure we load enough items for initial display
  useEffect(() => {
    // Only trigger this effect when we need more items AND haven't attempted this fetch yet
    if (galleryItems.length < displayCount && !isLoading && hasMore && !fetchAttemptedRef.current) {
      fetchAttemptedRef.current = true; // Mark that we've attempted to fetch more
      fetchMoreGalleryItems(page);
    }
  }, [displayCount, galleryItems.length, page, isLoading]);

  const loadMore = () => {
    // Reset fetch attempt flag when user manually requests more items
    fetchAttemptedRef.current = false;
    
    // Get number of columns based on current viewport
    let columnsCount = 5; // Default desktop
    if (window.innerWidth < 640) {
      columnsCount = 2; // Mobile
    } else if (window.innerWidth < 768) {
      columnsCount = 3; // Small tablet
    } else if (window.innerWidth < 1024) {
      columnsCount = 4; // Tablet
    }
    
    // Load 4 more rows
    setDisplayCount((prev) => prev + columnsCount * 4);
  };

  // Handle keyboard navigation for gallery items
  const handleKeyDown = (e: React.KeyboardEvent, itemId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      router.push(`/${locale}/photo/${itemId}`);
    }
  };

  // Get only the items we need to display
  const displayedItems = galleryItems.slice(0, displayCount);

  // Determine if we need to show the "Load More" button
  const canLoadMore = hasMore || galleryItems.length > displayCount;

  if (isError && galleryItems.length === 0) {
    return (
      <div className="mt-12 text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg" role="alert" aria-live="polite">
        <p className="text-red-600 dark:text-red-400">Unable to load gallery images. Please try again later.</p>
        <button 
          onClick={() => mutate()}
          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          aria-label="Try loading gallery again"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="mt-12" aria-labelledby="gallery-heading">
      <h2 id="gallery-heading" className="sr-only">AI-Generated Photo Gallery Examples</h2>
      
      {/* Hidden content for SEO - will be indexed but not visible */}
      <div className="sr-only">
        <h4>AI-Generated Photo Gallery Examples</h4>
        <ul>
          {galleryItems.map((item) => (
            <li key={`seo-${item.id}`}>
              <h5>AI Photo Example</h5>
              <p>{item.prompt}</p>
            </li>
          ))}
        </ul>
      </div>

      {galleryItems.length === 0 && isLoading ? (
        <div className="h-64" aria-live="polite" aria-busy="true">
          <LoadingSpinner size="lg" label="Loading gallery..." />
        </div>
      ) : (
        <div 
          ref={containerRef}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1 md:gap-2"
          role="grid"
          aria-label="Gallery of AI-generated photos"
        >
          {displayedItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: index * 0.02 }}
              className="relative aspect-square overflow-hidden rounded-sm cursor-pointer"
              onClick={() => router.push(`/${locale}/photo/${item.id}`)}
              onKeyDown={(e) => handleKeyDown(e, item.id)}
              tabIndex={0}
              role="gridcell"
              aria-label={`AI photo with prompt: ${item.prompt}`}
              style={{ outline: 'none' }}
            >
              <Image
                src={`${item.public_url}?width=420`}
                alt={`AI generated photo: ${item.prompt.slice(0, 50)}${item.prompt.length > 50 ? '...' : ''}`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                className="object-cover"
                priority={index === 0}
              />
              
              {/* Hover overlay with prompt */}
              <div className="absolute inset-0 bg-black/70 dark:bg-black/80 opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300 flex items-center justify-center p-3 overflow-y-auto">
                <div className="max-h-full">
                  <p className="text-white text-xs">
                    {item.prompt}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {error && galleryItems.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-center" role="alert" aria-live="polite">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {canLoadMore && (
        <div className="flex justify-center mt-8">
          <button
            onClick={loadMore}
            disabled={isLoading}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:bg-purple-300 dark:disabled:bg-purple-800 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            aria-label={isLoading ? "Loading more gallery images" : "Load more gallery images"}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <ButtonSpinner />
                Loading...
              </span>
            ) : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
} 