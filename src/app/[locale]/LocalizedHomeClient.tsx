'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useLocale } from '@/lib/utils';
import Hero from '@/components/features/Hero';
import AppShowcase from '@/components/features/AppShowcase';
import Features from '@/components/features/Features';
import UserGallery from '@/components/features/Testimonials';
import Pricing from '@/components/features/Pricing';
import FAQ from '@/components/features/FAQ';
import SupportForm from '@/components/app/SupportForm';
import HomeBlog from '@/components/features/HomeBlog';
import HomeUseCases from '@/components/features/HomeUseCases';
import type { GalleryItem } from '@/types/gallery';
import type { BlogListItem } from '@/types/blog';

type HomeUseCaseItem = { slug: string; title: string; featured_image_urls?: string[] };

export default function LocalizedHomeClient({
  initialGallery = [],
  initialBlog = [],
  initialUseCases = [],
}: {
  initialGallery?: GalleryItem[];
  initialBlog?: BlogListItem[];
  initialUseCases?: HomeUseCaseItem[];
}) {
  const pathname = usePathname();
  const locale = useLocale();
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
      <div className="min-h-screen">
        {isSupport ? (
          <SupportForm />
        ) : (
          <>
            <Hero />
            <AppShowcase />
            <Features />
            <Pricing />
            <HomeUseCases initialUseCases={initialUseCases} locale={locale} />
            <UserGallery initialItems={initialGallery} />
            <HomeBlog initialPosts={initialBlog} />
            <FAQ />
          </>
        )}
      </div>
    </>
  );
}
