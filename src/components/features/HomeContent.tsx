import type { BlogListItem } from '@/types/blog';
import type { GalleryItem } from '@/types/gallery';
import AppShowcase from './AppShowcase';
import FAQ from './FAQ';
import Features from './Features';
import Hero from './Hero';
import HomeBlog from './HomeBlog';
import HomeUseCases from './HomeUseCases';
import Pricing from './Pricing';
import UserGallery from './Testimonials';

type HomeUseCaseItem = {
  slug: string;
  title: string;
  featured_image_urls?: string[];
};

type Props = {
  locale: string;
  initialGallery?: GalleryItem[];
  initialBlog?: BlogListItem[];
  initialUseCases?: HomeUseCaseItem[];
};

export default function HomeContent({
  locale,
  initialGallery = [],
  initialBlog = [],
  initialUseCases = [],
}: Props) {
  return (
    <div className="min-h-screen">
      <Hero locale={locale} />
      <AppShowcase locale={locale} />
      <Features locale={locale} />
      <Pricing locale={locale} />
      <HomeUseCases initialUseCases={initialUseCases} locale={locale} />
      <UserGallery initialItems={initialGallery} />
      <HomeBlog initialPosts={initialBlog} locale={locale} />
      <FAQ locale={locale} />
    </div>
  );
}
