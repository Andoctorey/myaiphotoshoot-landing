'use client';

import { usePathname } from 'next/navigation';
import Hero from '@/components/features/Hero';
import Features from '@/components/features/Features';
import UserGallery from '@/components/features/Testimonials';
import Pricing from '@/components/features/Pricing';
import Download from '@/components/features/Download';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import SupportForm from '@/components/app/SupportForm';

export default function LocalizedHome() {
  const pathname = usePathname();
  const isSupport = pathname?.endsWith('/support/') || pathname?.endsWith('/support');
  
  return (
    <>
      <Navigation />
      <main className="min-h-screen">
        {isSupport ? (
          <SupportForm />
        ) : (
          <>
            <Hero />
            <Features />
            <UserGallery />
            <Pricing />
            <Download />
          </>
        )}
      </main>
      <Footer />
    </>
  );
} 