'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  aiPresetCatalogPath,
  parseAiPresetCatalog,
  sortAiPresetCatalog,
  type AiPresetCatalogEntry,
  type AiPresetCatalogSort,
} from '@/lib/ai-preset-catalog';
import { aiPresetsPagePath, type AiPresetsPage } from '@/lib/ai-presets-shared';
import type { AiPreset } from '@/types/ai-preset';
import { localePath } from '@/lib/seo';
import {
  clearPresetAssignments,
  readPresetAssignment,
  readPresetExperimentConsent,
  resolvePresetAssignments,
} from '@/lib/preset-assignments';
import PresetGridImage from './PresetGridImage';

type Props = {
  locale: string;
  initialPage: AiPresetsPage;
  title: string;
  description: string;
  emptyLabel: string;
};

type PresetSort = AiPresetCatalogSort;
type PreviewPreset = AiPreset & { previewResolved?: boolean };

function updateSortUrl(locale: string, sort: PresetSort) {
  const url = new URL(localePath(locale, '/presets/'), window.location.origin);
  if (sort === 'new') url.searchParams.set('sort', sort);
  window.history.replaceState(window.history.state, '', url);
}

async function fetchPresetCatalog(locale: string): Promise<AiPresetCatalogEntry[]> {
  const response = await fetch(aiPresetCatalogPath(locale));
  if (!response.ok) throw new Error(`Preset catalog returned ${response.status}.`);
  return parseAiPresetCatalog(await response.json());
}

function catalogPage(
  catalog: readonly AiPresetCatalogEntry[],
  pageSize: number,
  offset: number,
  sort: PresetSort,
): { presets: AiPreset[]; totalCount: number } {
  const sorted = sortAiPresetCatalog(catalog, sort);
  return {
    presets: sorted.slice(offset, offset + pageSize),
    totalCount: sorted.length,
  };
}

async function assignedPreviews(presets: AiPreset[]): Promise<PreviewPreset[]> {
  const originals = presets.map((preset) => ({ ...preset, previewResolved: true }));
  const consent = readPresetExperimentConsent();
  if (consent === 'rejected') return originals;
  try {
    await resolvePresetAssignments(presets.map((preset) => preset.id));
  } catch (error) {
    console.warn('Using original preset grid previews', error);
  }
  if (readPresetExperimentConsent() === 'rejected') return originals;
  return originals.map((preset) => {
    const assignment = readPresetAssignment(preset.id);
    return assignment ? {
      ...preset,
      featured_graphics: assignment.featured_graphics,
      featured_graphics_alt: assignment.featured_graphics_alt,
      cost_credits: assignment.cost_credits ?? preset.cost_credits,
    } : preset;
  });
}

export default function AiPresetsGrid({
  locale,
  initialPage,
  title,
  description,
  emptyLabel,
}: Props) {
  const t = useTranslations('presets');
  const [presets, setPresets] = useState<PreviewPreset[]>(initialPage.presets);
  const basePresets = useRef(new Map(initialPage.presets.map((preset) => [preset.id, preset])));
  const [page, setPage] = useState(initialPage.page);
  const [hasMore, setHasMore] = useState(initialPage.hasNextPage);
  const [sort, setSort] = useState<PresetSort>('popular');
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [sortError, setSortError] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const inFlight = useRef(false);
  const initialSortApplied = useRef(false);
  const catalogRequest = useRef<Promise<AiPresetCatalogEntry[]> | null>(null);

  const loadCatalog = useCallback(() => {
    if (catalogRequest.current) return catalogRequest.current;
    const request = fetchPresetCatalog(locale);
    catalogRequest.current = request;
    void request.catch(() => {
      if (catalogRequest.current === request) catalogRequest.current = null;
    });
    return request;
  }, [locale]);

  const loadMore = useCallback(async () => {
    if (inFlight.current || !hasMore) return;
    inFlight.current = true;
    setIsLoading(true);
    setLoadError(false);
    const nextPage = page + 1;
    const offset = (nextPage - 1) * initialPage.pageSize;

    try {
      const result = catalogPage(
        await loadCatalog(),
        initialPage.pageSize,
        offset,
        sort,
      );
      for (const preset of result.presets) basePresets.current.set(preset.id, preset);
      const nextPresets = await assignedPreviews(result.presets);
      setPresets((current) => {
        const knownIds = new Set(current.map((preset) => preset.id));
        return [...current, ...nextPresets.filter((preset) => !knownIds.has(preset.id))];
      });
      setPage(nextPage);
      setHasMore(offset + nextPresets.length < result.totalCount);
    } catch (error) {
      console.error('Failed to load more presets', { locale, page: nextPage, error });
      setLoadError(true);
    } finally {
      inFlight.current = false;
      setIsLoading(false);
    }
  }, [hasMore, initialPage.pageSize, loadCatalog, locale, page, sort]);

  const changeSort = useCallback(async (
    nextSort: PresetSort,
    targetPage: number = 1,
    updateUrl: boolean = true,
  ) => {
    if (nextSort === sort || inFlight.current) return;
    const previousSort = sort;
    const offset = (targetPage - 1) * initialPage.pageSize;
    inFlight.current = true;
    setSort(nextSort);
    setIsLoading(true);
    setLoadError(false);
    setSortError(false);

    try {
      const result = catalogPage(
        await loadCatalog(),
        initialPage.pageSize,
        offset,
        nextSort,
      );
      for (const preset of result.presets) basePresets.current.set(preset.id, preset);
      setPresets(await assignedPreviews(result.presets));
      setPage(targetPage);
      setHasMore(offset + result.presets.length < result.totalCount);
      if (updateUrl) updateSortUrl(locale, nextSort);
    } catch (error) {
      console.error('Failed to sort presets', { locale, sort: nextSort, error });
      setSort(previousSort);
      setSortError(true);
    } finally {
      inFlight.current = false;
      setIsLoading(false);
    }
  }, [initialPage.pageSize, loadCatalog, locale, sort]);

  useEffect(() => {
    if (initialSortApplied.current) return;
    initialSortApplied.current = true;
    if (new URLSearchParams(window.location.search).get('sort') === 'new') {
      void changeSort('new', initialPage.page, false);
    }
  }, [changeSort, initialPage.page]);

  useEffect(() => {
    let cancelled = false;
    void assignedPreviews(initialPage.presets).then((resolved) => {
      if (cancelled) return;
      const byId = new Map(resolved.map((preset) => [preset.id, preset]));
      setPresets((current) => current.map((preset) => byId.get(preset.id) || preset));
    });
    return () => { cancelled = true; };
  }, [initialPage.presets]);

  useEffect(() => {
    const onConsent = () => {
      const originals = presets.map((preset) => basePresets.current.get(preset.id) || preset);
      if (readPresetExperimentConsent() === 'rejected') {
        clearPresetAssignments();
        setPresets(originals.map((preset) => ({ ...preset, previewResolved: true })));
        void fetch('/preset-test', { method: 'DELETE' }).catch((error) =>
          console.warn('Unable to clear preset test cookie', error));
      } else {
        void assignedPreviews(originals).then(setPresets);
      }
    };
    window.addEventListener('consent-choice-changed', onConsent);
    return () => window.removeEventListener('consent-choice-changed', onConsent);
  }, [presets]);

  useEffect(() => {
    if (!hasMore || loadError || isLoading || !sentinel.current
      || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) void loadMore();
    }, { rootMargin: '400px' });
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, loadError, loadMore]);

  const eagerImageIds = new Set(
    presets.filter((preset) => preset.featured_graphics).slice(0, 2).map((preset) => preset.id),
  );
  const nextPagePath = localePath(locale, aiPresetsPagePath(page + 1));
  const nextPageHref = sort === 'new' ? `${nextPagePath}?sort=new` : nextPagePath;

  return (
    <>
      <noscript><style>{'.preset-test-card-image{visibility:visible!important}'}</style></noscript>
      <header className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3">
          <h1 className="text-3xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-4xl">
            {title}
          </h1>
          <div className="flex flex-col items-end gap-2">
            <label>
              <span className="sr-only">{t('sortLabel')}</span>
              <select
                value={sort}
                onChange={(event) => void changeSort(event.target.value as PresetSort)}
                disabled={isLoading}
                className="min-h-11 cursor-pointer rounded-full border border-gray-300 bg-white px-4 py-2 text-base font-semibold text-gray-800 shadow-sm outline-none transition hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:cursor-wait disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              >
                <option value="popular">{t('sortPopular')}</option>
                <option value="new">{t('sortNewest')}</option>
              </select>
            </label>
            {sortError ? (
              <p role="alert" className="max-w-64 text-right text-sm text-red-600 dark:text-red-400">
                {t('sortError')}
              </p>
            ) : null}
          </div>
        </div>
        <p className="mt-3 max-w-3xl text-lg leading-7 text-gray-600 dark:text-gray-300 sm:text-xl sm:leading-8">
          {description}
        </p>
      </header>

      {presets.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
          {emptyLabel}
        </div>
      ) : (
        <div
          aria-busy={isLoading}
          className="grid grid-cols-2 gap-px min-[830px]:grid-cols-3 min-[1100px]:grid-cols-4"
        >
          {presets.map((preset) => (
            <Link
              key={preset.id}
              data-preset-test-id={preset.id}
              href={localePath(locale, `/presets/${preset.slug}/`)}
              className="group block min-w-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              <div className="preset-test-card-media relative isolate aspect-square overflow-hidden bg-gray-200 dark:bg-gray-800">
                {preset.featured_graphics ? (
                  <PresetGridImage
                    src={preset.featured_graphics}
                    alt={preset.featured_graphics_alt?.trim() || t('imageAlt', { name: preset.name })}
                    hasActiveTest={preset.has_active_test === true}
                    resolved={preset.previewResolved === true}
                    eager={eagerImageIds.has(preset.id)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-900 text-4xl font-bold text-white dark:bg-gray-800">
                    {preset.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-48% via-black/20 to-black/80"
                />
                <h2 className="absolute inset-x-0 bottom-0 line-clamp-2 p-2 text-base font-bold leading-tight text-white [overflow-wrap:anywhere]">
                  {preset.name}
                </h2>
              </div>
            </Link>
          ))}
        </div>
      )}

      {hasMore ? (
        <div ref={sentinel} className="mt-8 flex flex-col items-center gap-3">
          <p aria-live="polite" className="sr-only">
            {isLoading ? t('loading') : ''}
          </p>
          {loadError ? (
            <p role="alert" className="text-center text-sm text-gray-600 dark:text-gray-300">
              {t('loadError')}
            </p>
          ) : null}
          <Link
            href={nextPageHref}
            rel="next"
            onClick={(event) => {
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              event.preventDefault();
              void loadMore();
            }}
            aria-disabled={isLoading}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-gray-300 px-6 py-2 font-semibold text-gray-800 hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary aria-disabled:cursor-wait aria-disabled:opacity-50 dark:border-gray-700 dark:text-gray-200"
          >
            {isLoading ? t('loading') : t('loadMore')}
          </Link>
        </div>
      ) : null}
    </>
  );
}
