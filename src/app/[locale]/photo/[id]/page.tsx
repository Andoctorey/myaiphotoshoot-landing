import PhotoPageClient from '@/app/photo/[id]/PhotoPageClient';
import { locales } from '@/i18n/request';
import { fetchGalleryPhotos } from '@/lib/fetcher';
import type { GalleryItem } from '@/types/gallery';
import { notFound } from 'next/navigation';

interface PhotoPageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

export async function generateStaticParams() {
  const data = await fetchGalleryPhotos<GalleryItem[]>(1, 20);
  return locales.flatMap((locale) =>
    data.map((item: GalleryItem) => ({
      locale,
      id: item.id,
    }))
  );
}

async function getPhotoData(id: string): Promise<GalleryItem | null> {
  const data = await fetchGalleryPhotos<GalleryItem[]>();
  return data.find((item) => item.id === id) || null;
}

async function getAdjacentPhotos(id: string): Promise<{ prev: GalleryItem | null; next: GalleryItem | null }> {
  const data = await fetchGalleryPhotos<GalleryItem[]>();
  const currentIndex = data.findIndex((item) => item.id === id);
  return {
    prev: currentIndex > 0 ? data[currentIndex - 1] : null,
    next: currentIndex < data.length - 1 ? data[currentIndex + 1] : null,
  };
}

export default async function PhotoPage({ params }: PhotoPageProps) {
  const { id, locale } = await params;
  const photo = await getPhotoData(id);
  const { prev, next } = await getAdjacentPhotos(id);
  if (!photo) return notFound();
  return <PhotoPageClient photo={photo} prev={prev} next={next} locale={locale} />;
} 