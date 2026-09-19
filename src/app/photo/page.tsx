'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { env } from '@/lib/env';

interface PublicPhoto {
  id: string;
  public_url: string;
  prompt?: string;
}

const PHOTO_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CTA_COPY: Record<string, string> = {
  ar: 'إنشاء صورة مثل هذه',
  de: 'Ein ähnliches Foto erstellen',
  en: 'Make one like this',
  es: 'Crear una foto como esta',
  fr: 'Créer une photo comme celle-ci',
  hi: 'ऐसी फ़ोटो बनाएँ',
  ja: 'このような写真を作る',
  ru: 'Создать похожее фото',
  zh: '制作这样的照片',
};

function resolveLocale(): string {
  const queryLocale = new URLSearchParams(window.location.search).get('lang');
  const candidates = [queryLocale, ...navigator.languages];
  return candidates
    .map((candidate) => candidate?.split('-')[0].toLowerCase())
    .find((locale) => locale && locale in CTA_COPY) || 'en';
}

export default function LocalPhotoPage() {
  const [photo, setPhoto] = useState<PublicPhoto | null>(null);
  const [error, setError] = useState(false);
  const [locale, setLocale] = useState('en');

  useEffect(() => {
    const queryId = new URLSearchParams(window.location.search).get('id');
    const pathId = window.location.pathname.split('/').filter(Boolean).at(-1);
    const id = queryId || pathId || '';
    if (!PHOTO_ID_PATTERN.test(id)) {
      setError(true);
      return;
    }
    setLocale(resolveLocale());

    const controller = new AbortController();
    const generationUrl = new URL(`${env.SUPABASE_FUNCTIONS_URL}/get-generation`);
    generationUrl.search = new URLSearchParams({ id, platform: 'web' }).toString();
    void fetch(generationUrl, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`get-generation returned ${response.status}`);
        return response.json() as Promise<PublicPhoto>;
      })
      .then((result) => {
        if (result.id !== id || !result.public_url?.startsWith('https://')) {
          throw new Error('get-generation returned an invalid public photo');
        }
        setPhoto(result);
      })
      .catch((fetchError: unknown) => {
        if (fetchError instanceof Error && fetchError.name === 'AbortError') return;
        console.error('Failed to load public photo', { id, error: fetchError });
        setError(true);
      });

    return () => controller.abort();
  }, []);

  if (error) {
    return (
      <main className="mx-auto min-h-[70vh] max-w-3xl px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-on-surface">Photo unavailable</h1>
        <p className="mt-3 text-on-surface-variant">This public photo could not be loaded.</p>
        <Link className="mt-6 inline-block font-semibold text-primary" href="/#gallery">Back to gallery</Link>
      </main>
    );
  }

  if (!photo) {
    return <main className="min-h-[70vh] px-4 py-16 text-center text-on-surface-variant">Loading photo…</main>;
  }

  const prompt = photo.prompt?.trim() || 'AI-generated photo';
  const galleryHref = locale === 'en' ? '/gallery/' : `/${locale}/gallery/`;

  return (
    <main className="mx-auto min-h-[70vh] max-w-3xl px-4 py-10 sm:py-14">
      <Link className="mb-5 inline-block font-semibold text-primary" href={galleryHref}>← Back to gallery</Link>
      <article className="overflow-hidden rounded-3xl border border-outline-variant bg-surface-container-low shadow-xl">
        <div className="relative aspect-square w-full bg-surface-container">
          <Image
            src={photo.public_url}
            alt={prompt}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-contain"
          />
        </div>
        <div className="p-6 sm:p-8">
          <a
            className="mb-6 flex justify-center rounded-full bg-primary px-6 py-4 font-bold text-on-primary transition hover:bg-primary/90"
            href={`https://app.myaiphotoshoot.com/#generate/${encodeURIComponent(photo.id)}`}
          >
            {CTA_COPY[locale]}
          </a>
          <p className="leading-relaxed text-on-surface-variant">{prompt}</p>
        </div>
      </article>
    </main>
  );
}
