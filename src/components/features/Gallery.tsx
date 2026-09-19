'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { HomepageGalleryItem, GalleryRandomSession } from '@/types/gallery';
import { env } from '@/lib/env';
import { toHomepageGalleryItem } from '@/lib/homepage-gallery';
import { useLocale, useTranslations } from '@/lib/utils';
import PhotoCard from '@/components/features/PhotoCard';

const PAGE_SIZE = 20;
const INITIAL_VISIBLE_COUNT = 20;
const LOAD_MORE_COUNT = 20;
const HOME_PREVIEW_COUNT = 10;

type GallerySort = 'popular' | 'new' | 'random';

const ImagePlaceholder = () => (
  <div className="relative aspect-square overflow-hidden rounded-sm bg-gray-200 animate-pulse dark:bg-gray-800" />
);

function mergeUniqueItems(
  currentItems: HomepageGalleryItem[],
  newItems: HomepageGalleryItem[],
): HomepageGalleryItem[] {
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

function buildGalleryUrl(
  page: number,
  sort: GallerySort,
  randomSession: GalleryRandomSession | null,
  limit: number,
): string {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sort,
    platform: 'web',
  });

  if (sort === 'random' && randomSession) {
    params.set('seed', randomSession.seed);
    params.set('asOf', randomSession.asOf);
  }

  return `${env.SUPABASE_FUNCTIONS_URL}/public-gallery?${params.toString()}`;
}

function buildGalleryItemAppHref(item: HomepageGalleryItem, locale: string): string {
  return `/photo/${encodeURIComponent(item.id)}/?lang=${encodeURIComponent(locale)}`;
}

export default function Gallery({
  initialItems = [],
  initialRandomSession,
  preview = false,
}: {
  initialItems?: HomepageGalleryItem[];
  initialRandomSession?: GalleryRandomSession;
  preview?: boolean;
}) {
  const t = useTranslations('gallery');
  const locale = useLocale();
  const [sort, setSort] = useState<GallerySort>(preview ? 'random' : 'popular');
  const [randomSession, setRandomSession] = useState<GalleryRandomSession | null>(
    () => preview ? initialRandomSession ?? createRandomSession() : null
  );
  const [galleryItems, setGalleryItems] = useState<HomepageGalleryItem[]>(initialItems);
  const pageSize = preview ? HOME_PREVIEW_COUNT : PAGE_SIZE;
  const [visibleCount, setVisibleCount] = useState(preview ? HOME_PREVIEW_COUNT : INITIAL_VISIBLE_COUNT);
  const [nextPage, setNextPage] = useState(initialItems.length > 0 ? 2 : 1);
  const [hasMore, setHasMore] = useState(initialItems.length === 0 || initialItems.length >= PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialFetchAttemptedRef = useRef(false);
  const isLoadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

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
      const response = await fetch(buildGalleryUrl(pageNumber, requestedSort, requestedRandomSession, pageSize));
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`.trim());
      }

      const data: unknown = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Gallery response was not an array.');
      }
      const newItems = data.map(toHomepageGalleryItem);

      setGalleryItems((currentItems) => (
        mode === 'replace' ? newItems : mergeUniqueItems(currentItems, newItems)
      ));
      setHasMore(newItems.length >= pageSize);
      setNextPage(pageNumber + 1);
    } catch (fetchError) {
      console.error('Error fetching gallery items:', fetchError);
      setError(t('error'));
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [pageSize, t]);

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

  const loadMore = useCallback(async () => {
    const nextVisibleCount = visibleCount + LOAD_MORE_COUNT;

    if (galleryItems.length < nextVisibleCount && hasMore) {
      await fetchPage(nextPage, 'append', sort, randomSession);
    }

    setVisibleCount(nextVisibleCount);
  }, [fetchPage, galleryItems.length, hasMore, nextPage, randomSession, sort, visibleCount]);

  useEffect(() => {
    if (preview || !hasMore || isLoading || error || !sentinelRef.current
      || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) void loadMore();
    }, { rootMargin: '400px' });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [error, hasMore, isLoading, loadMore, preview]);

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
      <div className="mt-12 rounded-lg bg-error-container p-8 text-center" role="alert" aria-live="polite">
        <p className="text-on-error-container">{error}</p>
        <button
          onClick={() => void fetchPage(1, 'replace', sort, randomSession)}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-on-primary transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          aria-label={t('tryAgain')}
        >
          {t('tryAgain')}
        </button>
      </div>
    );
  }

  return (
    <div className={preview ? 'mt-6' : ''} aria-label={t('seoHeading')}>

      {!preview && (
        <header className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3">
            <h1 className="text-3xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-4xl">
              {t('title')}
            </h1>
            <label>
              <span className="sr-only">{t('sortAriaLabel')}</span>
              <select
                value={sort}
                onChange={(event) => selectSort(event.target.value as GallerySort)}
                disabled={isLoading}
                className="min-h-11 cursor-pointer rounded-full border border-gray-300 bg-white px-4 py-2 text-base font-semibold text-gray-800 shadow-sm outline-none transition hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:cursor-wait disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              >
                <option value="popular">{t('popularSort')}</option>
                <option value="new">{t('newestSort')}</option>
                <option value="random">{t('randomSort')}</option>
              </select>
            </label>
          </div>
          <p className="mt-3 max-w-3xl text-lg leading-7 text-gray-600 dark:text-gray-300 sm:text-xl sm:leading-8">
            {t('description')}
          </p>
        </header>
      )}

      <div className={preview ? '-mx-4 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 lg:mx-0 lg:overflow-visible lg:px-0 lg:pb-0' : ''}>
        <ul
          className={preview
            ? 'flex w-max snap-x snap-mandatory gap-4 lg:grid lg:w-full lg:grid-cols-5'
            : 'grid grid-cols-2 gap-px min-[830px]:grid-cols-3 min-[1100px]:grid-cols-4'}
          aria-label={t('ariaLabel')}
        >
          {galleryItems.length === 0 ? (
            Array.from({ length: preview ? HOME_PREVIEW_COUNT : 10 }).map((_, index) => (
              <li
                key={`placeholder-${index}`}
                className={preview ? 'w-[68vw] max-w-[280px] shrink-0 snap-center lg:w-auto lg:max-w-none' : undefined}
              >
                <ImagePlaceholder />
              </li>
            ))
          ) : (
            displayedItems.map((item) => {
              return (
                <li
                  key={item.id}
                  className={preview ? 'w-[68vw] max-w-[280px] shrink-0 snap-center lg:w-auto lg:max-w-none' : undefined}
                >
                  <figure className="relative isolate overflow-hidden bg-gray-200 dark:bg-gray-800">
                    <PhotoCard
                      src={item.publicUrl}
                      alt={`${t('altPrefix')}: ${item.promptSummary}`}
                      mode="fill"
                      sizes={preview
                        ? '(max-width: 1023px) 68vw, 20vw'
                        : '(min-width: 1280px) 304px, (min-width: 1100px) calc((100vw - 67px) / 4), (min-width: 830px) calc((100vw - 50px) / 3), calc((100vw - 33px) / 2)'}
                      containerClassName={preview ? 'aspect-square rounded-sm cursor-pointer' : 'aspect-square cursor-pointer'}
                      linkHref={buildGalleryItemAppHref(item, locale)}
                      linkDocument
                      ariaLabel={`${t('captionPrefix')}: ${item.promptSummary}`}
                    />
                    {!preview && (
                      <>
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-48% via-black/20 to-black/80"
                        />
                        <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 p-2 text-sm font-semibold leading-tight text-white sm:text-base">
                          <span className="line-clamp-2 [overflow-wrap:anywhere]">
                            {item.promptSummary}
                          </span>
                        </figcaption>
                      </>
                    )}
                  </figure>
                </li>
              );
            })
          )}
        </ul>
      </div>

      {error && galleryItems.length > 0 && (
        <div className="mt-4 rounded-lg bg-error-container p-3 text-center" role="alert" aria-live="polite">
          <p className="text-sm text-on-error-container">{error}</p>
        </div>
      )}

      {!preview && galleryItems.length > 0 && canLoadMore && (
        <div ref={sentinelRef} className="mt-8 flex flex-col items-center gap-3">
          <p aria-live="polite" className="sr-only">
            {isLoading ? t('loading') : ''}
          </p>
          <button
            onClick={() => void loadMore()}
            disabled={isLoading}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-gray-300 px-6 py-2 font-semibold text-gray-800 hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-50 dark:border-gray-700 dark:text-gray-200"
            aria-label={isLoading ? t('loading') : t('loadMore')}
            aria-busy={isLoading}
          >
            {isLoading ? t('loading') : t('loadMore')}
          </button>
        </div>
      )}
    </div>
  );
}
