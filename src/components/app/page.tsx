'use client';

import Hero from '@/components/features/Hero';
import Features from '@/components/features/Features';
import UserGallery from '@/components/features/Testimonials';
import Pricing from '@/components/features/Pricing';
import Download from '@/components/features/Download';

export default function Home() {
  return (
    <>
      <main className="min-h-screen">
        <Hero />
        <Features />
        <UserGallery />
        <Pricing />
        <Download />
      </main>
    </>
  );
} 