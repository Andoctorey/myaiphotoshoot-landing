import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { aiPresetsPagePath, fetchAiPresetsPage, formatPresetCostUsd, type AiPresetsPage } from '@/lib/ai-presets';
import { canonicalUrl, localePath } from '@/lib/seo';
import { serializeJsonLd } from '@/lib/json-ld';

type Props = {
  locale: string;
  page?: number;
  pageData?: AiPresetsPage;
};

export default async function AiPresetsIndex({ locale, page = 1, pageData }: Props) {
  const t = await getTranslations({ locale, namespace: 'presets' });
  const tNav = await getTranslations({ locale, namespace: 'navigation' });
  const presetsPage = pageData || await fetchAiPresetsPage(locale, page);
  const { presets } = presetsPage;
  const pageUrl = canonicalUrl(locale, aiPresetsPagePath(presetsPage.page));
  const title = t('title');
  const description = t('description');
  const previousPath = presetsPage.hasPreviousPage ? aiPresetsPagePath(presetsPage.page - 1) : null;
  const nextPath = presetsPage.hasNextPage ? aiPresetsPagePath(presetsPage.page + 1) : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: title,
            description,
            url: pageUrl,
            isPartOf: {
              '@type': 'WebSite',
              name: 'My AI Photo Shoot',
              url: 'https://myaiphotoshoot.com',
            },
            hasPart: presets.slice(0, 24).map((preset) => ({
              '@type': 'WebPage',
              name: preset.name,
              description: preset.subtitle || undefined,
              url: canonicalUrl(locale, `/presets/${preset.slug}/`),
              image: preset.featured_graphics || undefined,
            })),
          })
        }}
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm">
          <ol className="flex flex-wrap items-center gap-2 text-gray-600 dark:text-gray-300">
            <li>
              <Link href={localePath(locale, '/')} className="hover:text-purple-600 dark:hover:text-purple-400">
                {tNav('home')}
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li aria-current="page" className="text-gray-800 dark:text-gray-200">
              {t('breadcrumb')}
            </li>
          </ol>
        </nav>

        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-purple-700 dark:text-purple-300">
            {t('eyebrow')}
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-5xl">
            {t('heading')}
          </h1>
          <p className="mt-4 text-lg leading-8 text-gray-700 dark:text-gray-300">
            {description}
          </p>
        </div>

        {presets.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
            {t('empty')}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {presets.map((preset) => {
              const formattedCost = formatPresetCostUsd(preset.cost, locale);
              return (
                <Link
                  key={preset.id}
                  href={localePath(locale, `/presets/${preset.slug}/`)}
                  className="group block overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="aspect-square bg-gray-200 dark:bg-gray-800">
                    {preset.featured_graphics ? (
                      <Image
                        src={preset.featured_graphics}
                        alt={preset.featured_graphics_alt?.trim() || t('imageAlt', { name: preset.name })}
                        width={640}
                        height={640}
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-900 text-4xl font-bold text-white dark:bg-gray-800">
                        {preset.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-xl font-semibold text-gray-950 transition-colors group-hover:text-purple-700 dark:text-white dark:group-hover:text-purple-300">
                        {preset.name}
                      </h2>
                      {formattedCost ? (
                        <span className="shrink-0 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-950 dark:text-purple-200">
                          {formattedCost}
                        </span>
                      ) : null}
                    </div>
                    {preset.subtitle && (
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
                        {preset.subtitle}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {presetsPage.totalPages > 1 && (
          <nav
            aria-label={t('paginationLabel')}
            className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-6 text-sm dark:border-gray-800 sm:flex-row"
          >
            <div className="text-gray-600 dark:text-gray-300">
              {t('paginationStatus', { page: presetsPage.page, totalPages: presetsPage.totalPages })}
            </div>
            <div className="flex items-center gap-3">
              {previousPath ? (
                <Link
                  href={localePath(locale, previousPath)}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 font-semibold text-gray-800 transition hover:border-purple-400 hover:text-purple-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-purple-500 dark:hover:text-purple-300"
                >
                  {t('previousPage')}
                </Link>
              ) : null}
              {nextPath ? (
                <Link
                  href={localePath(locale, nextPath)}
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-purple-600 px-4 font-semibold text-white transition hover:bg-purple-700"
                >
                  {t('nextPage')}
                </Link>
              ) : null}
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
