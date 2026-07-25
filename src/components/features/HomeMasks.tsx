import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import MaskCategoryIcon from '@/components/masks/MaskCategoryIcon';
import {
  fetchMasksCatalog,
  masksForCategory,
} from '@/lib/ai-masks';
import { localePath } from '@/lib/seo';
import type { AiMask, AiMaskCategory } from '@/types/ai-mask';

const FEATURED_MASK_SLUGS = ['goatee', 'clean-girl', 'cyberpunk'];

type MaskComparison = {
  category: AiMaskCategory;
  mask: AiMask;
};

export default async function HomeMasks({ locale }: { locale: string }) {
  const [t, catalog] = await Promise.all([
    getTranslations({ locale, namespace: 'masks' }),
    fetchMasksCatalog(locale),
  ]);
  const preferred = FEATURED_MASK_SLUGS.flatMap((slug): MaskComparison[] => {
    const mask = catalog.masks.find((item) => item.slug === slug);
    const category = mask
      ? catalog.categories.find((item) => item.id === mask.categoryId)
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
    .slice(0, 3);

  if (comparisons.length === 0) return null;

  return (
    <section
      id="masks"
      className="overflow-hidden bg-gradient-to-b from-white via-purple-50/50 to-white py-12 dark:from-gray-900 dark:via-purple-950/20 dark:to-gray-900 md:py-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.4fr)]">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-400">
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
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-900/15 transition hover:-translate-y-0.5 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              {t('browseAll')}
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="-mx-4 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 lg:mx-0 lg:overflow-visible lg:px-0">
            <div className="flex w-max snap-x snap-mandatory gap-4 lg:grid lg:w-full lg:grid-cols-3">
              {comparisons.map(({ category, mask }) => (
                <article
                  key={category.id}
                  className="w-[78vw] max-w-[330px] shrink-0 snap-center overflow-hidden rounded-2xl border border-purple-200/70 bg-white shadow-lg shadow-purple-900/10 dark:border-purple-800/60 dark:bg-gray-800 lg:w-auto"
                >
                  <div className="grid grid-cols-2">
                    <div className="relative">
                      <Image
                        src={category.sourceImageUrl}
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
                        src={mask.featuredGraphics}
                        alt={t('resultAlt', { name: mask.name })}
                        width={420}
                        height={560}
                        sizes="(max-width: 1023px) 39vw, 12vw"
                        className="aspect-[3/4] h-full w-full object-cover"
                      />
                      <span className="absolute right-2 top-2 rounded-full bg-purple-600/90 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                        {t('after')}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-300">
                      <MaskCategoryIcon iconPath={category.iconPath} className="h-4 w-4 shrink-0" />
                      {category.name}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-gray-950 dark:text-white">
                      {mask.name}
                    </h3>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
