'use client';

import Image from 'next/image';
import { useState } from 'react';
import { AI_MASKS_APP_URL } from '@/lib/app-links';
import type { AiMask, AiMaskCategory, MaskAudienceGender } from '@/types/ai-mask';

type PreviewGender = Extract<MaskAudienceGender, 'female' | 'male'>;

type Props = {
  afterLabel: string;
  beforeLabel: string;
  category: AiMaskCategory;
  description: string;
  femaleLabel: string;
  genderLabel: string;
  maleLabel: string;
  masks: readonly AiMask[];
  resultAltLabel: string;
  title: string;
  tryMasksLabel: string;
};

function interpolate(label: string, key: string, value: string | number): string {
  return label.replace(`{${key}}`, String(value));
}

const previewVariantId = (gender: PreviewGender) => (
  gender === 'male' ? 'white_male' : 'white_female'
);

function categoryPreviewUrl(category: AiMaskCategory, gender: PreviewGender): string {
  return category.sourceImageVariants[previewVariantId(gender)] || category.sourceImageUrl;
}

function maskPreviewUrl(mask: AiMask, gender: PreviewGender): string {
  return mask.featuredGraphicsVariants[previewVariantId(gender)] || mask.featuredGraphics;
}

export default function AiMaskCategoryHighlights({
  afterLabel,
  beforeLabel,
  category,
  description,
  femaleLabel,
  genderLabel,
  maleLabel,
  masks,
  resultAltLabel,
  title,
  tryMasksLabel,
}: Props) {
  const initialGender: PreviewGender = category.audienceGender === 'male' ? 'male' : 'female';
  const [gender, setGender] = useState<PreviewGender>(initialGender);
  const [beforeMaskId, setBeforeMaskId] = useState<string | null>(null);
  const canSwitchGender = category.audienceGender === 'unisex';
  if (masks.length === 0) return null;

  return (
    <section className="mt-12" aria-labelledby="mask-category-highlights">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id="mask-category-highlights"
            className="text-2xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-3xl"
          >
            {title}
          </h2>
          <p className="mt-2 max-w-2xl text-gray-700 dark:text-gray-300">{description}</p>
        </div>
        {canSwitchGender ? (
          <div
            aria-label={genderLabel}
            className="flex h-11 w-[92px] shrink-0 items-center rounded-full border border-gray-300 bg-white p-1 shadow-sm dark:border-gray-700 dark:bg-gray-900"
            role="radiogroup"
          >
            {([
              { value: 'male', symbol: '♂', label: maleLabel },
              { value: 'female', symbol: '♀', label: femaleLabel },
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
                  onClick={() => {
                    setGender(choice.value);
                    setBeforeMaskId(null);
                  }}
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
        ) : null}
      </div>

      <div className="-mx-4 mt-5 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
        {masks.map((mask, index) => {
          const showBefore = beforeMaskId === mask.id;
          const imageUrl = showBefore
            ? categoryPreviewUrl(category, gender)
            : maskPreviewUrl(mask, gender);
          return (
            <button
              key={mask.id}
              type="button"
              aria-label={`${showBefore ? afterLabel : beforeLabel}: ${mask.name}`}
              aria-pressed={showBefore}
              onClick={() => setBeforeMaskId(showBefore ? null : mask.id)}
              className="group relative h-[152px] w-[124px] shrink-0 snap-start overflow-hidden rounded-2xl border border-gray-300 bg-gray-200 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-gray-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-500 dark:focus:ring-offset-gray-950"
            >
              <Image
                key={imageUrl}
                src={imageUrl}
                alt={showBefore
                  ? `${beforeLabel}: ${category.name}`
                  : interpolate(resultAltLabel, 'name', mask.name)}
                width={248}
                height={304}
                sizes="124px"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                priority={index < 4}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/85" />
              <span className="absolute right-2 top-2 rounded-full bg-purple-600/90 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                {showBefore ? beforeLabel : afterLabel}
              </span>
              <div className="absolute inset-x-0 bottom-0 px-2.5 py-2.5 text-center">
                <span className="line-clamp-2 text-sm font-semibold leading-tight text-white">
                  {mask.name}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <a
        href={AI_MASKS_APP_URL}
        className="mt-1 inline-flex min-h-11 items-center justify-center rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-purple-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950"
      >
        {tryMasksLabel}
      </a>
    </section>
  );
}
