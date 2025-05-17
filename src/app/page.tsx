'use client';

import Hero from '@/components/Hero';
import Features from '@/components/Features';
import UserGallery from '@/components/Testimonials';
import Pricing from '@/components/Pricing';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen">
        <Hero />
        <Features />
        <UserGallery />
        <Pricing />
      </main>
      <Footer />
    </>
  );
}
