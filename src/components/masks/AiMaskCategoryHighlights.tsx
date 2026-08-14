import Image from 'next/image';
import { AI_MASKS_APP_URL } from '@/lib/app-links';
import type { AiMask } from '@/types/ai-mask';

type Props = {
  afterLabel: string;
  creditCostLabel: string;
  description: string;
  locale: string;
  masks: readonly AiMask[];
  resultAltLabel: string;
  title: string;
  tryMasksLabel: string;
  viewAllLabel: string;
};

function interpolate(label: string, key: string, value: string | number): string {
  return label.replace(`{${key}}`, String(value));
}

export default function AiMaskCategoryHighlights({
  afterLabel,
  creditCostLabel,
  description,
  locale,
  masks,
  resultAltLabel,
  title,
  tryMasksLabel,
  viewAllLabel,
}: Props) {
  const highlights = masks.slice(0, 6);
  if (highlights.length === 0) return null;

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
        <a
          href="#current-category-masks"
          className="inline-flex min-h-11 shrink-0 items-center justify-center self-start rounded-xl border border-purple-300 bg-white px-4 py-2 text-sm font-semibold text-purple-700 transition hover:border-purple-400 hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:border-purple-800 dark:bg-gray-900 dark:text-purple-300 dark:hover:bg-purple-950/40 dark:focus:ring-offset-gray-950 sm:self-auto"
        >
          {viewAllLabel}
        </a>
      </div>

      <div className="-mx-4 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
        {highlights.map((mask, index) => (
          <a
            key={mask.id}
            href={AI_MASKS_APP_URL}
            aria-label={`${tryMasksLabel}: ${mask.name}`}
            className="group w-40 shrink-0 snap-start overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-purple-700 dark:focus:ring-offset-gray-950 sm:w-48"
          >
            <div className="relative overflow-hidden">
              <Image
                src={mask.featuredGraphics}
                alt={interpolate(resultAltLabel, 'name', mask.name)}
                width={560}
                height={700}
                sizes="(max-width: 639px) 160px, (max-width: 1023px) 192px, 180px"
                className="aspect-[4/5] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                priority={index < 2}
              />
              <span className="absolute right-2 top-2 rounded-full bg-purple-600/90 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                {afterLabel}
              </span>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-950 dark:text-white">{mask.name}</h3>
              <p className="mt-1 text-sm font-semibold text-purple-700 dark:text-purple-300">
                {interpolate(
                  creditCostLabel,
                  'credits',
                  new Intl.NumberFormat(locale, { maximumFractionDigits: 0 })
                    .format(mask.priceCredits),
                )}
              </p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
