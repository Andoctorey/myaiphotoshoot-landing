import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import PlatformAppLink from '@/components/features/PlatformAppLink';
import { serializeJsonLd } from '@/lib/json-ld';
import {
  formatCreditCost,
  FULL_TRAINING_CREDITS,
  LOWEST_GENERATION_CREDITS,
  STANDARD_TRAINING_CREDITS,
  supportedModels,
  type ModelGroup,
  type SupportedModel,
} from '@/lib/models';
import { canonicalUrl, localePath } from '@/lib/seo';
import type { PricingTierId } from '@/lib/pricing';

type Props = {
  locale: string;
};

const modelGroupOrder: ModelGroup[] = ['generate', 'edit', 'personal'];

function modelsByGroup(group: ModelGroup): SupportedModel[] {
  return supportedModels.filter((model) => model.group === group);
}

function accessBadgeClass(tier: PricingTierId): string {
  if (tier === 'max') {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200';
  }
  if (tier === 'pro') {
    return 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200';
  }
  return 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200';
}

export default async function ModelsPage({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: 'models' });
  const tNav = await getTranslations({ locale, namespace: 'navigation' });
  const pageUrl = canonicalUrl(locale, '/models/');
  const orderedModels = modelGroupOrder.flatMap(modelsByGroup);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${pageUrl}#models`,
    name: t('meta.title'),
    description: t('meta.description'),
    url: pageUrl,
    inLanguage: locale,
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
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: orderedModels.length,
      itemListElement: orderedModels.map((model, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Service',
          '@id': `${pageUrl}#${model.id}`,
          name: model.name,
          identifier: model.providerModel || model.id,
          category: t(`groups.${model.group}`),
          description: t(`bestFor.${model.bestForKey}`),
          provider: {
            '@type': 'Organization',
            '@id': 'https://myaiphotoshoot.com/#organization',
            name: 'My AI Photo Shoot',
          },
        },
      })),
    },
  };

  return (
    <div className="min-h-screen bg-white pt-24 text-gray-950 dark:bg-gray-950 dark:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      <section className="relative overflow-hidden border-b border-purple-100 bg-gradient-to-br from-purple-50 via-white to-sky-50 dark:border-gray-800 dark:from-purple-950/40 dark:via-gray-950 dark:to-sky-950/30">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-purple-300/25 blur-3xl dark:bg-purple-700/15" />
        <div className="relative mx-auto grid max-w-7xl items-start gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8 lg:py-16">
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
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-purple-700 dark:text-purple-300">
              {t('eyebrow')}
            </p>
            <h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl">
              {t('heading')}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-700 dark:text-gray-300">
              {t('description')}
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
                <div className="text-2xl font-bold">
                  {formatCreditCost(LOWEST_GENERATION_CREDITS)}
                </div>
                <div className="mt-1 text-sm leading-5 text-gray-600 dark:text-gray-300">{t('summary.otherModels')}</div>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
                <div className="text-2xl font-bold">
                  {formatCreditCost(STANDARD_TRAINING_CREDITS)} / {formatCreditCost(FULL_TRAINING_CREDITS)}
                </div>
                <div className="mt-1 text-sm leading-5 text-gray-600 dark:text-gray-300">{t('summary.training')}</div>
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md">
            <div className="rounded-3xl border border-gray-200/80 bg-white/90 p-5 shadow-2xl shadow-purple-900/10 backdrop-blur dark:border-gray-800 dark:bg-gray-900/90">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold uppercase tracking-wide text-purple-700 dark:text-purple-300">
                  {t('chooser.title')}
                </p>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  {t('creditUnit')}
                </span>
              </div>
              <div className="mt-5 space-y-5">
                {modelGroupOrder.map((group) => (
                  <div key={group}>
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {t(`groups.${group}`)}
                    </h2>
                    <div className="mt-2 divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
                      {modelsByGroup(group).map((model) => (
                        <div key={model.id} className="flex items-center justify-between gap-4 px-3 py-2.5">
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-gray-950 dark:text-white">{model.name}</span>
                            <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                              {t(`tiers.${model.tierKey}`)}
                            </span>
                          </span>
                          <span className="flex shrink-0 items-center gap-2">
                            <span className="text-sm font-bold">{formatCreditCost(model.creditCost)}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${accessBadgeClass(model.accessTier)}`}>
                              {t(`access.${model.accessTier}`)}
                            </span>
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
            {modelGroupOrder.map((key) => (
              <div
                key={key}
                className="rounded-2xl border border-gray-200 p-6 transition hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-lg dark:border-gray-800 dark:hover:border-purple-700"
              >
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
          <div className="mb-8 max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight">{t('table.title')}</h2>
            <p className="mt-3 text-gray-700 dark:text-gray-300">{t('table.description')}</p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('table.priceNote')}</p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <div className="overflow-x-auto">
              <table className="min-w-[920px] divide-y divide-gray-200 text-left text-sm dark:divide-gray-800">
                <thead className="bg-gray-100 text-xs uppercase tracking-wide text-gray-600 dark:bg-gray-900 dark:text-gray-300">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">{t('table.columns.model')}</th>
                    <th scope="col" className="px-4 py-3 font-semibold">{t('table.columns.bestFor')}</th>
                    <th scope="col" className="px-4 py-3 font-semibold">{t('table.columns.credits')}</th>
                    <th scope="col" className="px-4 py-3 font-semibold">{t('table.columns.resolution')}</th>
                    <th scope="col" className="px-4 py-3 font-semibold">{t('table.columns.access')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {orderedModels.map((model) => (
                    <tr key={model.id} id={model.id} className="scroll-mt-24 align-top">
                      <th scope="row" className="px-4 py-4 font-semibold text-gray-950 dark:text-white">
                        {model.name}
                        <div className="mt-1 text-xs font-normal text-gray-500 dark:text-gray-400">
                          {t(`groups.${model.group}`)} · {t(`tiers.${model.tierKey}`)}
                        </div>
                      </th>
                      <td className="max-w-md px-4 py-4 leading-6 text-gray-700 dark:text-gray-300">
                        {t(`bestFor.${model.bestForKey}`)}
                      </td>
                      <td className="px-4 py-4 font-bold text-gray-950 dark:text-white">
                        {formatCreditCost(model.creditCost)}
                      </td>
                      <td className="px-4 py-4 font-semibold text-gray-700 dark:text-gray-300">
                        {model.maxResolution}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${accessBadgeClass(model.accessTier)}`}>
                          {t(`access.${model.accessTier}`)}
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
            <PlatformAppLink
              analyticsParams={{ section: 'models', placement: 'bottom_cta' }}
              className="inline-flex items-center justify-center rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950"
            >
              {t('cta.primary')}
            </PlatformAppLink>
            <Link
              href={localePath(locale, '/presets/')}
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-6 py-3 font-semibold text-gray-900 transition hover:border-purple-400 hover:text-purple-700 dark:border-gray-700 dark:text-gray-100 dark:hover:border-purple-500 dark:hover:text-purple-300"
            >
              {t('cta.secondary')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
