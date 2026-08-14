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
  femaleLabel: string;
  genderLabel: string;
  holdToCompareLabel: string;
  maleLabel: string;
  masks: readonly AiMask[];
  resultAltLabel: string;
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
  femaleLabel,
  genderLabel,
  holdToCompareLabel,
  maleLabel,
  masks,
  resultAltLabel,
  tryMasksLabel,
}: Props) {
  const initialGender: PreviewGender = category.audienceGender === 'male' ? 'male' : 'female';
  const [gender, setGender] = useState<PreviewGender>(initialGender);
  const [selectedMaskId, setSelectedMaskId] = useState(() => masks[0]?.id || '');
  const [showBefore, setShowBefore] = useState(false);
  const canSwitchGender = category.audienceGender === 'unisex';
  const selectedMask = masks.find((mask) => mask.id === selectedMaskId) || masks[0];
  if (!selectedMask) return null;
  const selectedImageUrl = showBefore
    ? categoryPreviewUrl(category, gender)
    : maskPreviewUrl(selectedMask, gender);

  return (
    <section className="mt-10" aria-label={category.name}>
      {canSwitchGender ? (
        <div className="flex justify-end">
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
                    setShowBefore(false);
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
        </div>
      ) : null}

      <div className={`${canSwitchGender ? 'mt-4' : ''} flex justify-center`}>
        <button
          type="button"
          aria-label={`${holdToCompareLabel}: ${selectedMask.name}`}
          aria-pressed={showBefore}
          onPointerDown={(event) => {
            if (event.pointerType === 'mouse' && event.button !== 0) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            setShowBefore(true);
          }}
          onPointerUp={() => setShowBefore(false)}
          onPointerCancel={() => setShowBefore(false)}
          onPointerLeave={() => setShowBefore(false)}
          onLostPointerCapture={() => setShowBefore(false)}
          onKeyDown={(event) => {
            if (event.key !== ' ' && event.key !== 'Enter') return;
            event.preventDefault();
            setShowBefore(true);
          }}
          onKeyUp={(event) => {
            if (event.key !== ' ' && event.key !== 'Enter') return;
            event.preventDefault();
            setShowBefore(false);
          }}
          onBlur={() => setShowBefore(false)}
          onContextMenu={(event) => event.preventDefault()}
          onDragStart={(event) => event.preventDefault()}
          className="group relative aspect-[4/5] w-full max-w-[420px] overflow-hidden rounded-[28px] bg-gray-200 shadow-xl ring-1 ring-black/10 transition hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:bg-gray-800 dark:ring-white/10 dark:focus:ring-offset-gray-950"
        >
          <Image
            key={selectedImageUrl}
            src={selectedImageUrl}
            alt={showBefore
              ? `${beforeLabel}: ${category.name}`
              : interpolate(resultAltLabel, 'name', selectedMask.name)}
            width={840}
            height={1050}
            sizes="(max-width: 479px) calc(100vw - 32px), 420px"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/75" />
          <span className="absolute right-3 top-3 rounded-full bg-purple-600/90 px-3 py-1.5 text-xs font-semibold text-white shadow-sm backdrop-blur-sm">
            {showBefore ? beforeLabel : afterLabel}
          </span>
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-2 px-4 py-4 text-left">
            <span className="text-lg font-semibold text-white">{selectedMask.name}</span>
            <span className="rounded-full bg-black/65 px-3 py-1.5 text-xs font-semibold text-white shadow-sm backdrop-blur-sm">
              {holdToCompareLabel}
            </span>
          </div>
        </button>
      </div>

      <div className="-mx-4 mt-5 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
        {masks.map((mask) => {
          const selected = selectedMask.id === mask.id;
          return (
            <button
              key={mask.id}
              type="button"
              aria-label={mask.name}
              aria-pressed={selected}
              onClick={() => {
                setSelectedMaskId(mask.id);
                setShowBefore(false);
              }}
              className={`group relative h-[152px] w-[124px] shrink-0 snap-start overflow-hidden rounded-2xl bg-gray-200 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:bg-gray-800 dark:focus:ring-offset-gray-950 ${
                selected
                  ? 'border-2 border-gray-950 dark:border-white'
                  : 'border border-gray-300 hover:border-gray-500 dark:border-gray-700 dark:hover:border-gray-500'
              }`}
            >
              <Image
                src={maskPreviewUrl(mask, gender)}
                alt={interpolate(resultAltLabel, 'name', mask.name)}
                width={248}
                height={304}
                sizes="124px"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/85" />
              {selected ? (
                <span
                  aria-hidden="true"
                  className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-950 text-sm font-bold text-white shadow-sm dark:bg-white dark:text-gray-950"
                >
                  ✓
                </span>
              ) : null}
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
