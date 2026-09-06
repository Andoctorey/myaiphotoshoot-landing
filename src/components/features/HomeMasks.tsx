import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import MaskCategoryIcon from '@/components/masks/MaskCategoryIcon';
import {
  fetchMasksCatalog,
  masksForCategory,
} from '@/lib/ai-masks';
import { buildMaskAppUrl } from '@/lib/app-links';
import { withCdnWidth } from '@/lib/image';
import { localePath } from '@/lib/seo';
import type { AiMask, AiMaskCategory } from '@/types/ai-mask';

// Snapshot of the highest-demand published masks; ties favor category variety.
const DEMAND_PRIORITY_MASKS = [
  { categorySlug: 'aging', maskSlug: 'prime' },
  { categorySlug: 'expression', maskSlug: 'smile' },
  { categorySlug: 'hair', maskSlug: 'wolf-cut' },
  { categorySlug: 'body', maskSlug: 'abs' },
  { categorySlug: 'outfit', maskSlug: 'prom' },
  { categorySlug: 'outfit-men', maskSlug: 'cardigan' },
] as const;

type MaskComparison = {
  category: AiMaskCategory;
  mask: AiMask;
};

export default async function HomeMasks({ locale }: { locale: string }) {
  const [t, catalog] = await Promise.all([
    getTranslations({ locale, namespace: 'masks' }),
    fetchMasksCatalog(locale),
  ]);
  const preferred = DEMAND_PRIORITY_MASKS.flatMap((featured): MaskComparison[] => {
    const category = catalog.categories.find((item) => item.slug === featured.categorySlug);
    const mask = category
      ? masksForCategory(catalog, category.id).find((item) => item.slug === featured.maskSlug)
      : undefined;
    return category && mask ? [{ category, mask }] : [];
  });
  const fallback = catalog.categories.flatMap((category): MaskComparison[] => {
    const mask = masksForCategory(catalog, category.id)[0];
    return mask ? [{ category, mask }] : [];
  });
  const comparisons = [...preferred, ...fallback]
    .filter((comparison, index, items) => (
      items.findIndex((item) => item.mask.id === comparison.mask.id) === index
    ))
    .slice(0, DEMAND_PRIORITY_MASKS.length);

  if (comparisons.length === 0) return null;

  return (
    <section
      id="masks"
      className="overflow-hidden bg-gradient-to-b from-white via-brand-50/50 to-white py-12 dark:from-gray-900 dark:via-brand-950/20 dark:to-gray-900 md:py-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.4fr)]">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              {t('eyebrow')}
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-4xl">
              {t('homeTitle')}
            </h2>
            <p className="mt-4 text-lg leading-8 text-gray-600 dark:text-gray-300">
              {t('homeDescription')}
            </p>
            <Link
              href={localePath(locale, '/masks/')}
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-on-primary shadow-lg shadow-brand-900/15 transition hover:-translate-y-0.5 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              {t('browseAll')}
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="-mx-4 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 lg:mx-0 lg:overflow-visible lg:px-0">
            <div className="flex w-max snap-x snap-mandatory gap-4 lg:grid lg:w-full lg:grid-cols-3">
              {comparisons.map(({ category, mask }) => (
                <a
                  key={mask.id}
                  href={buildMaskAppUrl(mask.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={mask.name}
                  className="w-[78vw] max-w-[330px] shrink-0 snap-center overflow-hidden rounded-2xl border border-brand-200/70 bg-white shadow-lg shadow-brand-900/10 transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:border-brand-800/60 dark:bg-gray-800 dark:focus:ring-offset-gray-950 lg:w-auto"
                >
                  <div className="grid grid-cols-2">
                    <div className="relative">
                      <Image
                        src={withCdnWidth(category.sourceImageUrl, 420) || category.sourceImageUrl}
                        alt={t('sourceAlt', { category: category.name })}
                        width={420}
                        height={560}
                        sizes="(max-width: 1023px) 39vw, 12vw"
                        className="aspect-[3/4] h-full w-full object-cover"
                      />
                      <span className="absolute left-2 top-2 rounded-full bg-black/65 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                        {t('before')}
                      </span>
                    </div>
                    <div className="relative">
                      <Image
                        src={withCdnWidth(mask.featuredGraphics, 420) || mask.featuredGraphics}
                        alt={t('resultAlt', { name: mask.name })}
                        width={420}
                        height={560}
                        sizes="(max-width: 1023px) 39vw, 12vw"
                        className="aspect-[3/4] h-full w-full object-cover"
                      />
                      <span className="absolute right-2 top-2 rounded-full bg-primary/90 px-2 py-1 text-[11px] font-semibold text-on-primary backdrop-blur-sm">
                        {t('after')}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-300">
                      <MaskCategoryIcon iconPath={category.iconPath} className="h-4 w-4 shrink-0" />
                      {category.name}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-gray-950 dark:text-white">
                      {mask.name}
                    </h3>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
