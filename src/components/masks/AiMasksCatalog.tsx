import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import MasksCatalogBrowser, {
  type MasksCatalogLabels,
} from '@/components/masks/MasksCatalogBrowser';
import { AI_MASKS_APP_URL } from '@/lib/app-links';
import { canonicalUrl, localePath } from '@/lib/seo';
import { serializeJsonLd } from '@/lib/json-ld';
import type { AiMasksCatalog as Catalog } from '@/types/ai-mask';

type Props = {
  locale: string;
  catalog: Catalog;
  publishedCategoryIds?: readonly string[];
};

export default async function AiMasksCatalog({ locale, catalog, publishedCategoryIds = [] }: Props) {
  const [t, tNav] = await Promise.all([
    getTranslations({ locale, namespace: 'masks' }),
    getTranslations({ locale, namespace: 'navigation' }),
  ]);
  const pageUrl = canonicalUrl(locale, '/masks/');
  const labels: MasksCatalogLabels = {
    availabilityWebAndroid: t('availabilityWebAndroid'),
    before: t('before'),
    categoryGuide: t('landing.categoryGuide'),
    categoryGuideLink: t.raw('landing.categoryGuideLink') as string,
    categoryNav: t('categoryNav'),
    female: t('genderFemale'),
    genderLabel: t('genderLabel'),
    male: t('genderMale'),
    maskCount: t.raw('maskCount') as string,
    readyDescription: t('readyDescription'),
    readyTitle: t('readyTitle'),
    resultAlt: t.raw('resultAlt') as string,
    sourceAlt: t.raw('sourceAlt') as string,
    tryMasks: t('tryMasks'),
    yourPhoto: t('yourPhoto'),
  };
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: t('heading'),
        description: t('description'),
        inLanguage: locale,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: catalog.masks.length,
          itemListElement: catalog.masks.map((mask, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
              '@type': 'Thing',
              name: mask.name,
              image: mask.featuredGraphics,
              url: AI_MASKS_APP_URL,
            },
          })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: tNav('home'),
            item: canonicalUrl(locale, '/'),
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: t('breadcrumb'),
            item: pageUrl,
          },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm">
          <ol className="flex flex-wrap items-center gap-2 text-gray-600 dark:text-gray-300">
            <li>
              <Link
                href={localePath(locale, '/')}
                className="hover:text-purple-600 dark:hover:text-purple-400"
              >
                {tNav('home')}
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li aria-current="page" className="text-gray-800 dark:text-gray-200">
              {t('breadcrumb')}
            </li>
          </ol>
        </nav>

        <header className="mx-auto mb-10 max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-purple-700 dark:text-purple-300">
            {t('eyebrow')}
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-5xl">
            {t('heading')}
          </h1>
          <p className="mt-4 text-lg leading-8 text-gray-700 dark:text-gray-300">
            {t('description')}
          </p>
          <a
            href={AI_MASKS_APP_URL}
            className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-purple-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950"
          >
            {t('tryMasks')}
          </a>
        </header>

        <MasksCatalogBrowser
          catalog={catalog}
          labels={labels}
          locale={locale}
          publishedCategoryIds={publishedCategoryIds}
        />
      </div>
    </div>
  );
}
