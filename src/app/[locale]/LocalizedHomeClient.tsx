'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Hero from '@/components/features/Hero';
import Features from '@/components/features/Features';
import UserGallery from '@/components/features/Testimonials';
import Pricing from '@/components/features/Pricing';
import FAQ from '@/components/features/FAQ';
import Download from '@/components/features/Download';
import Navigation from '@/components/layout/Navigation';
import SupportForm from '@/components/app/SupportForm';
import HomeBlog from '@/components/features/HomeBlog';
import type { GalleryItem } from '@/types/gallery';
import type { BlogListItem } from '@/types/blog';

export default function LocalizedHomeClient({ initialGallery = [], initialBlog = [] }: { initialGallery?: GalleryItem[]; initialBlog?: BlogListItem[] }) {
  const pathname = usePathname();
  const isSupport = pathname?.endsWith('/support/') || pathname?.endsWith('/support');
  
  useEffect(() => {
    // Check if we need to scroll to gallery
    const shouldScrollToGallery = sessionStorage.getItem('scrollToGallery');
    
    if (shouldScrollToGallery) {
      // Clear the flag
      sessionStorage.removeItem('scrollToGallery');
      
      // Wait for components to render, then scroll
      const scrollToGallery = () => {
        const galleryElement = document.getElementById('gallery');
        if (galleryElement) {
          const headerOffset = 80; // Approximate header height
          const elementPosition = galleryElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        } else {
          // If gallery not found yet, try again after a short delay
          setTimeout(scrollToGallery, 100);
        }
      };
      
      // Start scrolling after a short delay to ensure page is rendered
      setTimeout(scrollToGallery, 300);
    }
  }, []);
  
  return (
    <>
      <main className="min-h-screen">
        {isSupport ? (
          <SupportForm />
        ) : (
          <>
            <Hero />
            <Features />
            <UserGallery initialItems={initialGallery} />
            <HomeBlog initialPosts={initialBlog} />
            <Pricing />
            <FAQ />
            <Download />
          </>
        )}
      </main>
    </>
  );
} 