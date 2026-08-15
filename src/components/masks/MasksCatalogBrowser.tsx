'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import MaskCategoryIcon from '@/components/masks/MaskCategoryIcon';
import { AI_MASKS_APP_URL } from '@/lib/app-links';
import { localePath } from '@/lib/seo';
import type {
  AiMask,
  AiMaskCategory,
  AiMasksCatalog,
  MaskAudienceGender,
} from '@/types/ai-mask';

type PreviewGender = Extract<MaskAudienceGender, 'female' | 'male'>;

export type MasksCatalogLabels = {
  availabilityWebAndroid: string;
  before: string;
  categoryGuide: string;
  female: string;
  genderLabel: string;
  male: string;
  maskCount: string;
  readyDescription: string;
  readyTitle: string;
  resultAlt: string;
  sourceAlt: string;
  tryMasks: string;
  yourPhoto: string;
};

type Props = {
  catalog: AiMasksCatalog;
  labels: MasksCatalogLabels;
  locale: string;
  publishedCategoryIds?: readonly string[];
};

const previewVariantId = (gender: PreviewGender) => (
  gender === 'male' ? 'white_male' : 'white_female'
);

function categoryPreviewUrl(category: AiMaskCategory, gender: PreviewGender): string {
  return category.sourceImageVariants[previewVariantId(gender)] || category.sourceImageUrl;
}

function maskPreviewUrl(mask: AiMask, gender: PreviewGender): string {
  return mask.featuredGraphicsVariants[previewVariantId(gender)] || mask.featuredGraphics;
}

function interpolate(label: string, key: string, value: string | number): string {
  return label.replace(`{${key}}`, String(value));
}

export default function MasksCatalogBrowser({
  catalog,
  labels,
  locale,
  publishedCategoryIds = [],
}: Props) {
  const [gender, setGender] = useState<PreviewGender>('female');
  const publishedCategoryIdSet = useMemo(
    () => new Set(publishedCategoryIds),
    [publishedCategoryIds],
  );
  const publishedCategories = useMemo(
    () => catalog.categories.filter((category) => publishedCategoryIdSet.has(category.id)),
    [catalog.categories, publishedCategoryIdSet],
  );
  const visibleCategories = useMemo(() => {
    const filtered = catalog.categories.filter((category) => (
      category.audienceGender === 'unisex' || category.audienceGender === gender
    ));
    return filtered.length > 0 ? filtered : catalog.categories;
  }, [catalog.categories, gender]);

  useEffect(() => {
    const categoryId = window.location.hash.slice(1);
    if (!categoryId) return;
    const categorySection = document.getElementById(categoryId);
    if (categorySection instanceof HTMLDetailsElement) categorySection.open = true;
  }, []);

  return (
    <>
      {publishedCategories.length > 0 ? (
        <nav
          aria-label={labels.categoryGuide}
          className="mb-8 rounded-2xl border border-purple-200 bg-purple-50/70 px-4 py-5 dark:border-purple-900 dark:bg-purple-950/20 sm:px-6"
        >
          <p className="mb-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
            {labels.categoryGuide}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {publishedCategories.map((category) => (
              <Link
                key={category.id}
                href={localePath(locale, `/masks/${category.slug}/`)}
                aria-label={`${labels.categoryGuide}: ${category.name}`}
                className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-800 ring-1 ring-purple-200 transition hover:bg-purple-100 hover:ring-purple-300 dark:bg-purple-950/40 dark:text-purple-200 dark:ring-purple-800 dark:hover:bg-purple-950/70"
              >
                <MaskCategoryIcon iconPath={category.iconPath} className="h-4 w-4 shrink-0" />
                {category.name}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}

      <section
        aria-labelledby="mask-preview-gender-label"
        className="sticky top-16 z-20 -mx-4 border-y border-gray-200 bg-gray-50/90 px-4 py-3 backdrop-blur-lg dark:border-gray-800 dark:bg-gray-950/90 sm:-mx-6 sm:px-6 lg:mx-0 lg:rounded-2xl lg:border lg:px-4"
      >
        <div className="flex items-center justify-center gap-3">
          <span id="mask-preview-gender-label" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {labels.genderLabel}
          </span>
          <div
            aria-labelledby="mask-preview-gender-label"
            className="flex h-11 w-[92px] shrink-0 items-center rounded-full border border-gray-300 bg-white p-1 shadow-sm dark:border-gray-700 dark:bg-gray-900"
            role="radiogroup"
          >
            {([
              { value: 'male', symbol: '♂', label: labels.male },
              { value: 'female', symbol: '♀', label: labels.female },
            ] as const).map((choice) => {
              const selected = gender === choice.value;
              return (
                <button
                  key={choice.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={choice.label}
                  title={choice.label}
                  onClick={() => setGender(choice.value)}
                  className={`flex h-9 flex-1 items-center justify-center rounded-full text-xl font-semibold transition ${
                    selected
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-purple-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-purple-300'
                  }`}
                >
                  <span aria-hidden="true">{choice.symbol}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div className="mt-8 space-y-4">
        {visibleCategories.map((category) => {
          const masks = catalog.masks.filter((mask) => mask.categoryId === category.id);
          return (
            <details
              key={category.id}
              id={category.slug}
              aria-labelledby={`${category.slug}-title`}
              className="group scroll-mt-36 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-purple-500 [&::-webkit-details-marker]:hidden sm:px-6 sm:py-5">
                <div className="flex items-center gap-3">
                  {category.iconPath ? (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 sm:h-11 sm:w-11">
                      <MaskCategoryIcon iconPath={category.iconPath} className="h-5 w-5 sm:h-6 sm:w-6" />
                    </span>
                  ) : null}
                  <div>
                    <h2
                      id={`${category.slug}-title`}
                      className="text-xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-2xl"
                    >
                      {category.name}
                    </h2>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <span>{interpolate(labels.maskCount, 'count', masks.length)}</span>
                      {category.hiddenOnIos ? (
                        <span
                          className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-950/50 dark:text-amber-200"
                        >
                          {labels.availabilityWebAndroid}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5 shrink-0 text-gray-400 transition-transform group-open:rotate-180"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                </svg>
              </summary>

              <div className="grid grid-cols-2 gap-4 border-t border-gray-100 p-5 dark:border-gray-800 sm:grid-cols-3 sm:p-6 lg:grid-cols-5">
                <article className="overflow-hidden rounded-2xl border border-dashed border-purple-300 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/20">
                  <div className="relative overflow-hidden">
                    <Image
                      src={categoryPreviewUrl(category, gender)}
                      alt={interpolate(labels.sourceAlt, 'category', category.name)}
                      width={560}
                      height={700}
                      sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 20vw"
                      className="aspect-[4/5] w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/80" />
                    <span className="absolute left-2 top-2 rounded-full bg-black/65 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                      {labels.before}
                    </span>
                    <h3 className="absolute inset-x-0 bottom-0 px-3 py-3 text-center text-sm font-semibold leading-tight text-white sm:text-base">
                      {labels.yourPhoto}
                    </h3>
                  </div>
                </article>

                {masks.map((mask) => (
                  <article
                    key={mask.id}
                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900"
                  >
                    <div className="relative overflow-hidden">
                      <Image
                        src={maskPreviewUrl(mask, gender)}
                        alt={interpolate(labels.resultAlt, 'name', mask.name)}
                        width={560}
                        height={700}
                        sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 20vw"
                        className="aspect-[4/5] w-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/85" />
                      <h3 className="absolute inset-x-0 bottom-0 px-3 py-3 text-center text-sm font-semibold leading-tight text-white sm:text-base">
                        {mask.name}
                      </h3>
                    </div>
                  </article>
                ))}
              </div>
            </details>
          );
        })}
      </div>

      <section className="mt-16 rounded-3xl bg-purple-100 px-6 py-9 text-center dark:bg-purple-950/40 sm:px-10">
        <h2 className="text-2xl font-bold text-gray-950 dark:text-white">
          {labels.readyTitle}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-gray-600 dark:text-gray-300">
          {labels.readyDescription}
        </p>
        <a
          href={AI_MASKS_APP_URL}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-purple-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950"
        >
          {labels.tryMasks}
        </a>
      </section>
    </>
  );
}
