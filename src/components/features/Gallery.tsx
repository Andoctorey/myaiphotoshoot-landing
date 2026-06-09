'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GalleryItem, GalleryRandomSession } from '@/types/gallery';
import { ButtonSpinner } from '@/components/ui/LoadingSpinner';
import { env } from '@/lib/env';
import { useTranslations } from '@/lib/utils';
import PhotoCard from '@/components/features/PhotoCard';

const PAGE_SIZE = 24;
const INITIAL_VISIBLE_COUNT = 20;
const LOAD_MORE_COUNT = 20;

type GallerySort = 'popular' | 'new' | 'random';

const ImagePlaceholder = () => (
  <div className="relative aspect-square overflow-hidden rounded-sm bg-gray-200 animate-pulse dark:bg-gray-800" />
);

function mergeUniqueItems(currentItems: GalleryItem[], newItems: GalleryItem[]): GalleryItem[] {
  const existingIds = new Set(currentItems.map((item) => item.id));
  return [
    ...currentItems,
    ...newItems.filter((item) => !existingIds.has(item.id)),
  ];
}

function createRandomSession(): GalleryRandomSession {
  return {
    seed: crypto.randomUUID(),
    asOf: new Date().toISOString(),
  };
}

function buildGalleryUrl(page: number, sort: GallerySort, randomSession: GalleryRandomSession | null): string {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: PAGE_SIZE.toString(),
    sort,
  });

  if (sort === 'random' && randomSession) {
    params.set('seed', randomSession.seed);
    params.set('asOf', randomSession.asOf);
  }

  return `${env.SUPABASE_FUNCTIONS_URL}/public-gallery?${params.toString()}`;
}

export default function Gallery({
  initialItems = [],
  initialRandomSession,
}: {
  initialItems?: GalleryItem[];
  initialRandomSession?: GalleryRandomSession;
}) {
  const t = useTranslations('gallery');
  const [sort, setSort] = useState<GallerySort>('random');
  const [randomSession, setRandomSession] = useState<GalleryRandomSession | null>(
    () => initialRandomSession ?? createRandomSession()
  );
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(initialItems);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const [nextPage, setNextPage] = useState(initialItems.length > 0 ? 2 : 1);
  const [hasMore, setHasMore] = useState(initialItems.length === 0 || initialItems.length >= PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialFetchAttemptedRef = useRef(false);
  const isLoadingRef = useRef(false);

  const fetchPage = useCallback(async (
    pageNumber: number,
    mode: 'append' | 'replace',
    requestedSort: GallerySort,
    requestedRandomSession: GalleryRandomSession | null,
  ) => {
    if (isLoadingRef.current) return;

    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(buildGalleryUrl(pageNumber, requestedSort, requestedRandomSession));
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`.trim());
      }

      const data = await response.json();
      const newItems = Array.isArray(data) ? (data as GalleryItem[]) : [];

      setGalleryItems((currentItems) => (
        mode === 'replace' ? newItems : mergeUniqueItems(currentItems, newItems)
      ));
      setHasMore(newItems.length >= PAGE_SIZE);
      setNextPage(pageNumber + 1);
    } catch (fetchError) {
      console.error('Error fetching gallery items:', fetchError);
      setError(t('error'));
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (
      initialItems.length === 0
      && galleryItems.length === 0
      && !isLoading
      && !error
      && !initialFetchAttemptedRef.current
    ) {
      initialFetchAttemptedRef.current = true;
      void fetchPage(1, 'replace', sort, randomSession);
    }
  }, [error, fetchPage, galleryItems.length, initialItems.length, isLoading, randomSession, sort]);

  const loadMore = async () => {
    const nextVisibleCount = visibleCount + LOAD_MORE_COUNT;

    if (galleryItems.length < nextVisibleCount && hasMore) {
      await fetchPage(nextPage, 'append', sort, randomSession);
    }

    setVisibleCount(nextVisibleCount);
  };

  const selectSort = (nextSort: GallerySort) => {
    if (nextSort === sort && nextSort !== 'random') return;

    const nextRandomSession = nextSort === 'random' ? createRandomSession() : null;
    setSort(nextSort);
    setRandomSession(nextRandomSession);
    setGalleryItems([]);
    setVisibleCount(INITIAL_VISIBLE_COUNT);
    setNextPage(1);
    setHasMore(true);
    void fetchPage(1, 'replace', nextSort, nextRandomSession);
  };

  const displayedItems = useMemo(
    () => galleryItems.slice(0, visibleCount),
    [galleryItems, visibleCount]
  );
  const canLoadMore = hasMore || galleryItems.length > visibleCount;

  if (error && galleryItems.length === 0) {
    return (
      <div className="mt-12 rounded-lg bg-red-50 p-8 text-center dark:bg-red-900/20" role="alert" aria-live="polite">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={() => void fetchPage(1, 'replace', sort, randomSession)}
          className="mt-4 rounded-lg bg-purple-600 px-4 py-2 text-white transition hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          aria-label={t('tryAgain')}
        >
          {t('tryAgain')}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6" aria-labelledby="gallery-heading">
      <h2 id="gallery-heading" className="sr-only">{t('seoHeading')}</h2>

      <div
        className="mb-4 flex justify-center"
        role="group"
        aria-label={t('sortAriaLabel')}
      >
        <div className="inline-flex rounded-lg bg-purple-100 p-1 dark:bg-purple-950">
          {([
            ['popular', t('popularSort')],
            ['new', t('newestSort')],
            ['random', t('randomSort')],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => selectSort(value)}
              disabled={isLoading}
              aria-pressed={sort === value}
              className={`rounded-md px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
                sort === value
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-purple-800 hover:bg-purple-200 dark:text-purple-200 dark:hover:bg-purple-900'
              } disabled:cursor-wait disabled:opacity-60`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <ul
        className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4 md:gap-2 lg:grid-cols-5"
        aria-label={t('ariaLabel')}
      >
        {galleryItems.length === 0 ? (
          Array.from({ length: 10 }).map((_, index) => (
            <li key={`placeholder-${index}`}>
              <ImagePlaceholder />
            </li>
          ))
        ) : (
          displayedItems.map((item, index) => (
            <li key={item.id}>
              <PhotoCard
                src={item.public_url}
                alt={`${t('altPrefix')}: ${item.prompt.slice(0, 50)}${item.prompt.length > 50 ? '...' : ''}`}
                mode="fill"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                priority={index === 0}
                containerClassName="aspect-square rounded-sm cursor-pointer"
                linkHref={`https://app.myaiphotoshoot.com/#generate/${item.id}`}
                linkExternal
                ariaLabel={`${t('promptAriaPrefix')}: ${item.prompt}`}
                figCaptionSrOnly={`${t('captionPrefix')}. ${item.prompt}`}
              />
            </li>
          ))
        )}
      </ul>

      {error && galleryItems.length > 0 && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-center dark:bg-red-900/20" role="alert" aria-live="polite">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {canLoadMore && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => void loadMore()}
            disabled={isLoading}
            className="rounded-lg bg-purple-600 px-6 py-2 text-white transition hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-purple-300 dark:focus:ring-offset-gray-900 dark:disabled:bg-purple-800"
            aria-label={isLoading ? t('loading') : t('loadMore')}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <ButtonSpinner />
                {t('loading')}
              </span>
            ) : t('loadMore')}
          </button>
        </div>
      )}
    </div>
  );
}
