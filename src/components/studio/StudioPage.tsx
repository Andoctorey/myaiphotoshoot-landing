import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import PlatformButtons from '@/components/features/PlatformButtons';
import { WEB_APP_STUDIO_URL } from '@/lib/app-links';
import { serializeJsonLd } from '@/lib/json-ld';
import {
  formatCreditRange,
  personalModelCosts,
  qualityBands,
  type QualityBand,
} from '@/lib/models';
import { canonicalUrl, localePath } from '@/lib/seo';

type Props = {
  locale: string;
};

const faqKeys = ['writing', 'autoMode', 'quality', 'personal', 'required'] as const;
const stepKeys = ['source', 'describe', 'create'] as const;
const sourceKeys = ['photo', 'personal'] as const;
const relatedKeys = ['presets', 'masks'] as const;

function accessBadgeClass(id: QualityBand['id']): string {
  if (id === 'max') {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200';
  }
  if (id === 'pro') {
    return 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200';
  }
  return 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200';
}

export default async function StudioPage({ locale }: Props) {
  const [t, tNav, tDownload] = await Promise.all([
    getTranslations({ locale, namespace: 'studio' }),
    getTranslations({ locale, namespace: 'navigation' }),
    getTranslations({ locale, namespace: 'download' }),
  ]);
  const pageUrl = canonicalUrl(locale, '/studio/');
  const qualityPreviewBand = qualityBands.find((band) => band.id === 'pro') ?? qualityBands[0];
  const qualityPreviewCredits = formatCreditRange(
    qualityPreviewBand.maxCredits,
    qualityPreviewBand.maxCredits,
    locale,
  );
  const faq = faqKeys.map((key) => ({
    question: t(`faq.${key}.question`),
    answer: t(`faq.${key}.answer`),
  }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${pageUrl}#webpage`,
    name: t('meta.title'),
    description: t('meta.description'),
    url: pageUrl,
    inLanguage: locale,
    about: [
      {
        '@type': 'Thing',
        name: t('heading'),
        description: t('description'),
      },
      {
        '@type': 'Thing',
        name: t('autoMode.title'),
        description: t('autoMode.description'),
      },
      {
        '@type': 'Thing',
        name: t('personal.title'),
        description: t('personal.description'),
      },
    ],
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
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-white text-gray-950 dark:bg-gray-950 dark:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      <section className="relative overflow-hidden border-b border-purple-100 bg-gradient-to-br from-purple-50 via-white to-sky-50 dark:border-gray-800 dark:from-purple-950/40 dark:via-gray-950 dark:to-sky-950/30">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-purple-300/25 blur-3xl dark:bg-purple-700/15" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8 lg:py-16">
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
            <div className="mt-7 max-w-3xl rounded-2xl border border-purple-200 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-purple-900 dark:bg-gray-900/80">
              <p className="font-semibold text-purple-800 dark:text-purple-200">{t('directAnswer.title')}</p>
              <p className="mt-2 leading-7 text-gray-700 dark:text-gray-300">{t('directAnswer.description')}</p>
            </div>
            <div className="mt-7">
              <PlatformButtons
                webAppLabel={t('cta.primary')}
                googlePlayLabel={tDownload('mobileApps.googlePlay')}
                appStoreLabel={tDownload('mobileApps.appStore')}
                webAppUrl={WEB_APP_STUDIO_URL}
                analyticsParams={{ section: 'studio', placement: 'hero_cta' }}
                className="sm:justify-start"
              />
            </div>
          </div>

          <div className="mx-auto w-full max-w-md">
            <p aria-hidden="true" className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-gray-600 dark:text-gray-300">
              {t('quality.visual.previewLabel')}
            </p>
            <div
              className="pointer-events-none select-none rounded-[24px] bg-[#EEE6F1] px-4 py-3 text-[#1D1A20] dark:bg-[#3B373F] dark:text-[#E7E0E8]"
              aria-hidden="true"
            >
              <div className="flex items-center justify-between gap-4">
                <p className="min-w-0 flex-1 truncate text-base font-semibold leading-6 tracking-[0.0125em]">
                  {t('quality.visual.title')}
                </p>
                <span className="max-w-[140px] shrink-0 truncate text-end text-sm font-semibold leading-5 tracking-[0.007em] text-[#3A91E8]">
                  {t('quality.visual.creditLabel', { credits: qualityPreviewCredits })}
                </span>
              </div>
              <div className="mt-1" dir="ltr">
                <div className="relative mx-4 h-12">
                  <span className="absolute -left-4 -right-4 top-1/2 h-6 -translate-y-1/2 rounded-full bg-[#1D1A20]/[0.12] dark:bg-[#E7E0E8]/[0.12]" />
                  <span className="absolute -left-4 right-1/3 top-1/2 h-6 -translate-y-1/2 rounded-full bg-[#3A91E8]/[0.82]" />
                  <span className="absolute left-0 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FFF7FF]/[0.56] dark:bg-[#151218]/[0.56]" />
                  <span className="absolute left-1/3 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FFF7FF]/[0.56] dark:bg-[#151218]/[0.56]" />
                  <span className="absolute left-2/3 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FFF7FF]/[0.56] dark:bg-[#151218]/[0.56]" />
                  <span className="absolute right-0 top-1/2 h-1 w-1 translate-x-1/2 -translate-y-1/2 rounded-full bg-[#4A454E]/[0.44] dark:bg-[#CCC4CF]/[0.44]" />
                  <span className="absolute left-2/3 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#CCC4CF] bg-[#FFF7FF] shadow-[0_3px_6px_rgba(0,0,0,0.22)] dark:border-[#958E99] dark:bg-[#E7E0E8]" />
                </div>
                <div className="flex justify-between gap-3 text-base font-normal leading-6 tracking-[0.03125em] text-[#4A454E] dark:text-[#CCC4CF]">
                  <bdi dir="auto">{t('quality.visual.faster')}</bdi>
                  <bdi dir="auto">{t('quality.visual.higherQuality')}</bdi>
                </div>
              </div>
            </div>
            <div className="mt-4 divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white/80 shadow-sm backdrop-blur dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900/80">
              {qualityBands.map((band) => (
                <div key={band.id} className="flex items-center justify-between gap-4 px-4 py-3">
                  <span>
                    <span className="block font-semibold">{t(`quality.bands.${band.id}.title`)}</span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">
                      {t('quality.maxResolution', { resolution: band.maxResolution })}
                    </span>
                  </span>
                  <span className="text-end">
                    <span className="block font-bold">
                      {formatCreditRange(band.minCredits, band.maxCredits, locale)} {t('quality.creditUnit')}
                    </span>
                    <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${accessBadgeClass(band.id)}`}>
                      {t(`access.${band.id}`)}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="how-studio-works" className="scroll-mt-24 bg-white py-12 dark:bg-gray-950 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-purple-700 dark:text-purple-300">
              {t('steps.eyebrow')}
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">{t('steps.title')}</h2>
            <p className="mt-3 text-lg leading-8 text-gray-700 dark:text-gray-300">{t('steps.description')}</p>
          </div>
          <ol className="mt-8 grid gap-5 md:grid-cols-3">
            {stepKeys.map((key, index) => (
              <li key={key} className="rounded-2xl border border-gray-200 p-6 dark:border-gray-800">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-800 dark:bg-purple-950 dark:text-purple-200">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-xl font-semibold">{t(`steps.${key}.title`)}</h3>
                <p className="mt-3 leading-7 text-gray-700 dark:text-gray-300">{t(`steps.${key}.description`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-gray-50 py-12 dark:bg-gray-900 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-purple-700 dark:text-purple-300">
              {t('starts.eyebrow')}
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">{t('starts.title')}</h2>
            <p className="mt-3 text-lg leading-8 text-gray-700 dark:text-gray-300">{t('starts.description')}</p>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {sourceKeys.map((key, index) => (
              <article key={key} className="rounded-3xl border border-gray-200 bg-white p-7 dark:border-gray-800 dark:bg-gray-950">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 font-bold text-purple-800 dark:bg-purple-950 dark:text-purple-200">
                  {index + 1}
                </span>
                <h3 className="mt-5 text-2xl font-semibold">{t(`starts.${key}.title`)}</h3>
                <p className="mt-3 leading-7 text-gray-700 dark:text-gray-300">{t(`starts.${key}.description`)}</p>
                <p className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 dark:bg-gray-900 dark:text-gray-300">
                  {t(`starts.${key}.choice`)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-purple-950 py-12 text-white md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-purple-200">{t('autoMode.eyebrow')}</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">{t('autoMode.title')}</h2>
            <p className="mt-4 text-lg leading-8 text-purple-100">{t('autoMode.description')}</p>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {(['photo', 'personal'] as const).map((key) => (
              <article key={key} className="rounded-3xl border border-white/15 bg-white/10 p-7 backdrop-blur">
                <h3 className="text-xl font-semibold">{t(`autoMode.${key}.title`)}</h3>
                <p className="mt-3 leading-7 text-purple-100">{t(`autoMode.${key}.description`)}</p>
              </article>
            ))}
          </div>
          <p className="mt-6 rounded-2xl bg-white px-5 py-4 font-semibold text-purple-950">{t('autoMode.control')}</p>
        </div>
      </section>

      <section className="bg-gray-50 py-12 dark:bg-gray-900 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-purple-700 dark:text-purple-300">
              {t('quality.eyebrow')}
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">{t('quality.title')}</h2>
            <p className="mt-3 text-lg leading-8 text-gray-700 dark:text-gray-300">{t('quality.description')}</p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <div className="overflow-x-auto">
              <table className="min-w-[760px] divide-y divide-gray-200 text-start text-sm dark:divide-gray-800">
                <thead className="bg-gray-100 text-xs uppercase tracking-wide text-gray-600 dark:bg-gray-900 dark:text-gray-300">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-semibold">{t('quality.columns.access')}</th>
                    <th scope="col" className="px-5 py-3 font-semibold">{t('quality.columns.bestFor')}</th>
                    <th scope="col" className="px-5 py-3 font-semibold">{t('quality.columns.credits')}</th>
                    <th scope="col" className="px-5 py-3 font-semibold">{t('quality.columns.resolution')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {qualityBands.map((band) => (
                    <tr key={band.id} className="align-top">
                      <th scope="row" className="px-5 py-5">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${accessBadgeClass(band.id)}`}>
                          {t(`access.${band.id}`)}
                        </span>
                        <span className="mt-2 block font-semibold text-gray-950 dark:text-white">
                          {t(`quality.bands.${band.id}.title`)}
                        </span>
                      </th>
                      <td className="max-w-md px-5 py-5 leading-6 text-gray-700 dark:text-gray-300">
                        {t(`quality.bands.${band.id}.description`)}
                      </td>
                      <td className="px-5 py-5 font-bold text-gray-950 dark:text-white">
                        {formatCreditRange(band.minCredits, band.maxCredits, locale)} {t('quality.creditUnit')}
                      </td>
                      <td className="px-5 py-5 font-semibold text-gray-700 dark:text-gray-300">
                        {band.maxResolution}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-gray-600 dark:text-gray-400">{t('quality.note')}</p>
        </div>
      </section>

      <section className="bg-purple-950 py-12 text-white md:py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_460px] lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-purple-200">{t('personal.eyebrow')}</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">{t('personal.title')}</h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-purple-100">{t('personal.description')}</p>
            <ul className="mt-7 space-y-4">
              {(['upload', 'train', 'create'] as const).map((key, index) => (
                <li key={key} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <span>
                    <span className="block font-semibold">{t(`personal.steps.${key}.title`)}</span>
                    <span className="mt-1 block leading-6 text-purple-100">{t(`personal.steps.${key}.description`)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur">
            <h3 className="text-xl font-semibold">{t('personal.costs.title')}</h3>
            <div className="mt-5 space-y-3">
              <div className="rounded-2xl bg-black/15 p-4">
                <p className="font-semibold">{t('personal.costs.standard.title')}</p>
                <p className="mt-1 text-sm leading-6 text-purple-100">
                  {t('personal.costs.standard.description', { credits: personalModelCosts.standardTrainingCredits })}
                </p>
              </div>
              <div className="rounded-2xl bg-black/15 p-4">
                <p className="font-semibold">{t('personal.costs.full.title')}</p>
                <p className="mt-1 text-sm leading-6 text-purple-100">
                  {t('personal.costs.full.description', { credits: personalModelCosts.fullTrainingCredits })}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-4 text-purple-950">
                <p className="font-semibold">{t('personal.costs.photos.title')}</p>
                <p className="mt-1 text-sm leading-6 text-purple-900">
                  {t('personal.costs.photos.description', { credits: personalModelCosts.imageCredits })}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-purple-100">{t('personal.costs.note')}</p>
          </div>
        </div>
      </section>

      <section className="bg-white py-12 dark:bg-gray-950 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-purple-700 dark:text-purple-300">
              {t('related.eyebrow')}
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">{t('related.title')}</h2>
            <p className="mt-3 text-lg leading-8 text-gray-700 dark:text-gray-300">{t('related.description')}</p>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {relatedKeys.map((key) => (
              <article key={key} className="rounded-3xl border border-gray-200 p-7 dark:border-gray-800">
                <h3 className="text-2xl font-semibold">{t(`related.${key}.title`)}</h3>
                <p className="mt-3 leading-7 text-gray-700 dark:text-gray-300">{t(`related.${key}.description`)}</p>
                <Link
                  href={localePath(locale, key === 'presets' ? '/presets/' : '/masks/')}
                  className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-300 px-5 py-2.5 font-semibold text-gray-900 transition hover:border-purple-400 hover:text-purple-700 dark:border-gray-700 dark:text-gray-100 dark:hover:border-purple-500 dark:hover:text-purple-300"
                >
                  {t(`related.${key}.link`)}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-12 dark:bg-gray-900 md:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-purple-700 dark:text-purple-300">{t('faq.eyebrow')}</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">{t('faq.title')}</h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {faq.map((item) => (
              <article key={item.question} className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
                <h3 className="text-lg font-semibold">{item.question}</h3>
                <p className="mt-3 leading-7 text-gray-700 dark:text-gray-300">{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-12 dark:bg-gray-950 md:py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight">{t('cta.title')}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-gray-700 dark:text-gray-300">
            {t('cta.description')}
          </p>
          <div className="mt-8">
            <PlatformButtons
              webAppLabel={t('cta.primary')}
              googlePlayLabel={tDownload('mobileApps.googlePlay')}
              appStoreLabel={tDownload('mobileApps.appStore')}
              webAppUrl={WEB_APP_STUDIO_URL}
              analyticsParams={{ section: 'studio', placement: 'bottom_cta' }}
            />
            <Link
              href={`${localePath(locale, '/')}#pricing`}
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-300 px-5 py-2.5 font-semibold text-gray-900 transition hover:border-purple-400 hover:text-purple-700 dark:border-gray-700 dark:text-gray-100 dark:hover:border-purple-500 dark:hover:text-purple-300"
            >
              {t('cta.secondary')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
