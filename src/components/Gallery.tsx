'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { GalleryItem } from '@/types/gallery';

export default function Gallery() {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState<number>(20); // Default to 20 items (4 rows on desktop)
  const containerRef = useRef<HTMLDivElement>(null);

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
    if (galleryItems.length < displayCount && !loading && hasMore) {
      fetchGalleryItems();
    }
  }, [displayCount, galleryItems.length, loading, hasMore]);

  // Initial data fetch
  useEffect(() => {
    fetchGalleryItems();
  }, []);

  const fetchGalleryItems = async () => {
    if (loading) return; // Prevent concurrent fetches

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `https://trzgfajvyjpvbqedyxug.supabase.co/functions/v1/public-gallery?page=${page}&limit=24`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch gallery items');
      }
      
      const data = await response.json();
      
      if (data.length === 0) {
        setHasMore(false);
      } else {
        setGalleryItems((prevItems) => {
          const newItems = data.filter(
            (newItem: GalleryItem) => !prevItems.some((prevItem) => prevItem.id === newItem.id)
          );
          return [...prevItems, ...newItems];
        });
        setPage((prevPage) => prevPage + 1);
      }
    } catch (error) {
      console.error('Error fetching gallery items:', error);
      setError('Unable to load gallery images. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
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

  // Get only the items we need to display
  const displayedItems = galleryItems.slice(0, displayCount);

  // Determine if we need to show the "Load More" button
  const canLoadMore = hasMore || galleryItems.length > displayCount;

  if (error && galleryItems.length === 0) {
    return (
      <div className="mt-12 text-center p-8 bg-red-50 rounded-lg">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => fetchGalleryItems()}
          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="mt-12">
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

      {galleryItems.length === 0 && loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse flex space-x-4">
            <div className="h-12 w-12 bg-purple-200 rounded-full"></div>
            <div className="space-y-4">
              <div className="h-4 w-36 bg-purple-200 rounded"></div>
              <div className="h-4 w-24 bg-purple-200 rounded"></div>
            </div>
          </div>
        </div>
      ) : (
        <div 
          ref={containerRef}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1 md:gap-2"
        >
          {displayedItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: index * 0.02 }}
              className="relative aspect-square overflow-hidden rounded-sm cursor-pointer"
              onClick={() => window.location.href = `/photo/${item.id}`}
            >
              <Image
                src={`${item.public_url}?width=420`}
                alt={`AI generated photo`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                className="object-cover"
              />
              
              {/* Hover overlay with prompt */}
              <div className="absolute inset-0 bg-black/70 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-3 overflow-y-auto">
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
        <div className="mt-4 p-3 bg-red-50 rounded-lg text-center">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {canLoadMore && (
        <div className="flex justify-center mt-8">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:bg-purple-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
} 