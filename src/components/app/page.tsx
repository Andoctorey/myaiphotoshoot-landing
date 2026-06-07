import Hero from '@/components/features/Hero';
import Features from '@/components/features/Features';
import UserGallery from '@/components/features/Testimonials';
import Pricing from '@/components/features/Pricing';
import Download from '@/components/features/Download';

export default function Home() {
  const locale = 'en';

  return (
    <>
      <main className="min-h-screen">
        <Hero locale={locale} />
        <Features locale={locale} />
        <UserGallery />
        <Pricing locale={locale} />
        <Download locale={locale} />
      </main>
    </>
  );
}
