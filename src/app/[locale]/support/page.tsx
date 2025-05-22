'use client';

import SupportForm from '@/components/app/SupportForm';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';

export default function SupportPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen pt-24">
        <SupportForm />
      </main>
      <Footer />
    </>
  );
} 