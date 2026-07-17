import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { canonicalUrl, localePath } from '@/lib/seo';
import { serializeJsonLd } from '@/lib/json-ld';
import { buildDigitalOfferPolicies } from '@/lib/product-offer';
import {
  formatModelPriceUsd,
  LOWEST_GENERAL_MODEL_PRICE_USD,
  PERSONAL_MODEL_PHOTO_PRICE_USD,
  supportedModels,
  TRAINING_PRICE_USD,
  type ModelGroup,
  type SupportedModel,
} from '@/lib/models';
import PlatformAppLink from '@/components/features/PlatformAppLink';

type Props = {
  locale: string;
};

const groupOrder: ModelGroup[] = ['personal', 'generate', 'edit'];
const chooserGroups: ModelGroup[] = ['personal', 'generate', 'edit'];

function modelsByGroup(group: ModelGroup): SupportedModel[] {
  return supportedModels.filter((model) => model.group === group);
}

export default async function ModelsPage({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: 'models' });
  const tNav = await getTranslations({ locale, namespace: 'navigation' });
  const pageUrl = canonicalUrl(locale, '/models/');
  const trainingPrice = formatModelPriceUsd(TRAINING_PRICE_USD, locale);
  const offerPolicies = buildDigitalOfferPolicies({
    priceCurrency: 'USD',
    policyUrl: canonicalUrl(locale, '/legal/'),
  });

  return (
    <main className="min-h-screen bg-white pt-24 text-gray-950 dark:bg-gray-950 dark:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            '@id': `${pageUrl}#models`,
            name: t('meta.title'),
            description: t('meta.description'),
            url: pageUrl,
            inLanguage: locale,
            mainEntityOfPage: pageUrl,
            breadcrumb: {
              '@type': 'BreadcrumbList',
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
            isPartOf: {
              '@type': 'WebSite',
              name: 'My AI Photo Shoot',
              url: 'https://myaiphotoshoot.com',
            },
            mainEntity: {
              '@type': 'ItemList',
              itemListElement: supportedModels.map((model, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                item: {
                  '@type': 'Product',
                  '@id': `${pageUrl}#${model.id}`,
                  name: model.name,
                  category: t(`groups.${model.group}`),
                  description: t(`bestFor.${model.bestForKey}`),
                  brand: {
                    '@type': 'Brand',
                    name: 'My AI Photo Shoot',
                  },
                  offers: {
                    '@type': 'Offer',
                    priceCurrency: 'USD',
                    price: model.priceUsd.toFixed(2),
                    url: `${pageUrl}#${model.id}`,
                    ...offerPolicies,
                  },
                },
              })),
            },
          })
        }}
      />

      <section className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8 lg:py-16">
          <div>
            <nav aria-label="Breadcrumb" className="mb-6 text-sm">
              <ol className="flex flex-wrap items-center gap-2 text-gray-600 dark:text-gray-300">
                <li>
                  <Link href={localePath(locale, '/')} className="hover:text-purple-700 dark:hover:text-purple-300">
                    {tNav('home')}
                  </Link>
                </li>
                <li className="text-gray-400">/</li>
                <li aria-current="page" className="text-gray-800 dark:text-gray-200">
                  {t('breadcrumb')}
                </li>
              </ol>
            </nav>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              {t('eyebrow')}
            </p>
            <h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl">
              {t('heading')}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-700 dark:text-gray-300">
              {t('description')}
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
                <div className="text-2xl font-bold">{trainingPrice}</div>
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">{t('summary.training')}</div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
                <div className="text-2xl font-bold">{formatModelPriceUsd(PERSONAL_MODEL_PHOTO_PRICE_USD, locale)}</div>
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">{t('summary.personalPhoto')}</div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
                <div className="text-2xl font-bold">{formatModelPriceUsd(LOWEST_GENERAL_MODEL_PRICE_USD, locale)}+</div>
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">{t('summary.otherModels')}</div>
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xl shadow-gray-950/10 dark:border-gray-800 dark:bg-gray-950">
              <p className="text-sm font-semibold uppercase tracking-wide text-purple-700 dark:text-purple-300">
                {t('chooser.title')}
              </p>
              <div className="mt-5 space-y-5">
                {groupOrder.map((group) => (
                  <div key={group}>
                    <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                      {t(`groups.${group}`)}
                    </h2>
                    <div className="mt-2 divide-y divide-gray-100 rounded-lg border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
                      {modelsByGroup(group).map((model) => (
                        <div key={model.id} className="flex items-start justify-between gap-4 px-3 py-2.5">
                          <span className="font-medium text-gray-950 dark:text-white">{model.name}</span>
                          <span className="text-right text-xs leading-5 text-gray-500 dark:text-gray-400">
                            {formatModelPriceUsd(model.priceUsd, locale)}
                            <br />
                            {t(`tiers.${model.tierKey}`)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-12 dark:bg-gray-950 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight">{t('chooser.title')}</h2>
            <p className="mt-3 text-lg leading-8 text-gray-700 dark:text-gray-300">
              {t('chooser.description')}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {chooserGroups.map((key) => (
              <div key={key} className="rounded-lg border border-gray-200 p-5 dark:border-gray-800">
                <h3 className="text-lg font-semibold">{t(`chooser.${key}.title`)}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                  {t(`chooser.${key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-12 dark:bg-gray-900 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">{t('table.title')}</h2>
              <p className="mt-3 max-w-3xl text-gray-700 dark:text-gray-300">{t('table.description')}</p>
            </div>
            <div className="shrink-0 text-sm text-gray-600 dark:text-gray-300">{t('table.priceNote', { trainingPrice })}</div>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
            <div className="overflow-x-auto">
              <table className="min-w-[900px] divide-y divide-gray-200 text-left text-sm dark:divide-gray-800">
                <thead className="bg-gray-100 text-xs uppercase tracking-wide text-gray-600 dark:bg-gray-900 dark:text-gray-300">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">{t('table.columns.model')}</th>
                    <th scope="col" className="px-4 py-3 font-semibold">{t('table.columns.type')}</th>
                    <th scope="col" className="px-4 py-3 font-semibold">{t('table.columns.bestFor')}</th>
                    <th scope="col" className="px-4 py-3 font-semibold">{t('table.columns.price')}</th>
                    <th scope="col" className="px-4 py-3 font-semibold">{t('table.columns.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {groupOrder.flatMap((group) => modelsByGroup(group)).map((model) => (
                    <tr key={model.id} id={model.id} className="scroll-mt-24 align-top">
                      <th scope="row" className="px-4 py-4 font-semibold text-gray-950 dark:text-white">
                        {model.name}
                        {model.providerModel ? (
                          <div className="mt-1 text-xs font-normal text-gray-500 dark:text-gray-400">{model.providerModel}</div>
                        ) : null}
                      </th>
                      <td className="px-4 py-4 text-gray-700 dark:text-gray-300">
                        {t(`groups.${model.group}`)}
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t(`tiers.${model.tierKey}`)}</div>
                      </td>
                      <td className="max-w-sm px-4 py-4 leading-6 text-gray-700 dark:text-gray-300">
                        {t(`bestFor.${model.bestForKey}`)}
                      </td>
                      <td className="px-4 py-4 font-semibold text-gray-950 dark:text-white">
                        {formatModelPriceUsd(model.priceUsd, locale)}
                        <div className="mt-1 text-xs font-normal text-gray-500 dark:text-gray-400">
                          {t(`pricing.${model.pricingKey}`)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">
                          {t('status.supported')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-12 dark:bg-gray-950 md:py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight">{t('cta.title')}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-gray-700 dark:text-gray-300">
            {t('cta.description')}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <PlatformAppLink className="inline-flex items-center justify-center rounded-lg bg-purple-600 px-6 py-3 font-semibold text-white transition hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950">
              {t('cta.primary')}
            </PlatformAppLink>
            <Link
              href={localePath(locale, '/presets/')}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-900 transition hover:border-purple-400 hover:text-purple-700 dark:border-gray-700 dark:text-gray-100 dark:hover:border-purple-500 dark:hover:text-purple-300"
            >
              {t('cta.secondary')}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
