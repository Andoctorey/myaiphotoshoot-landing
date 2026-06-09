import type { GalleryRandomSession } from '@/types/gallery';

export function createDailyGalleryRandomSession(date = new Date()): GalleryRandomSession {
  const utcDate = date.toISOString().slice(0, 10);

  return {
    seed: `daily:${utcDate}`,
    asOf: `${utcDate}T00:00:00.000Z`,
  };
}

export function isSameGalleryRandomSession(
  first: GalleryRandomSession,
  second: GalleryRandomSession,
): boolean {
  return first.seed === second.seed && first.asOf === second.asOf;
}
