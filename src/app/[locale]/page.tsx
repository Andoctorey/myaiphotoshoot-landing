'use client';

import Hero from '@/components/Hero';
import Features from '@/components/Features';
import UserGallery from '@/components/Testimonials';
import Pricing from '@/components/Pricing';
import Download from '@/components/Download';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function LocalizedHome() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen">
        <Hero />
        <Features />
        <UserGallery />
        <Pricing />
        <Download />
      </main>
      <Footer />
    </>
  );
} 