import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import PlatformButtons from '@/components/features/PlatformButtons';
import { WEB_APP_STUDIO_URL } from '@/lib/app-links';
import { serializeJsonLd } from '@/lib/json-ld';
import { personalModelCosts, studioPhotoCredits } from '@/lib/models';
import { canonicalUrl, localePath } from '@/lib/seo';

type Props = {
  locale: string;
};

const faqKeys = ['writing', 'autoMode', 'credits', 'personal', 'required'] as const;
const stepKeys = ['source', 'describe', 'create'] as const;
const sourceKeys = ['photo', 'personal'] as const;
const relatedKeys = ['presets', 'masks'] as const;

export default async function StudioPage({ locale }: Props) {
  const [t, tNav, tDownload] = await Promise.all([
    getTranslations({ locale, namespace: 'studio' }),
    getTranslations({ locale, namespace: 'navigation' }),
    getTranslations({ locale, namespace: 'download' }),
  ]);
  const pageUrl = canonicalUrl(locale, '/studio/');
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

      <section className="relative overflow-hidden border-b border-brand-100 bg-gradient-to-br from-brand-50 via-white to-brand-100 dark:border-gray-800 dark:from-brand-950/40 dark:via-gray-950 dark:to-brand-900/30">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-300/25 blur-3xl dark:bg-brand-700/15" />
        <div className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div>
            <nav aria-label="Breadcrumb" className="mb-6 text-sm">
              <ol className="flex flex-wrap items-center gap-2 text-gray-600 dark:text-gray-300">
                <li>
                  <Link href={localePath(locale, '/')} className="hover:text-primary">
                    {tNav('home')}
                  </Link>
                </li>
                <li className="text-gray-400">/</li>
                <li aria-current="page" className="text-gray-800 dark:text-gray-200">
                  {t('breadcrumb')}
                </li>
              </ol>
            </nav>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              {t('eyebrow')}
            </p>
            <h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl">
              {t('heading')}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-700 dark:text-gray-300">
              {t('description')}
            </p>
            <div className="mt-7 max-w-3xl rounded-2xl border border-brand-200 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-brand-900 dark:bg-gray-900/80">
              <p className="font-semibold text-brand-800 dark:text-brand-200">{t('directAnswer.title')}</p>
              <p className="mt-2 leading-7 text-gray-700 dark:text-gray-300">{t('directAnswer.description')}</p>
            </div>
            <div className="mt-7">
              <PlatformButtons
                webAppLabel={t('cta.primary')}
                webAppEyebrow={tDownload('webApp.badgeEyebrow')}
                webAppTitle={tDownload('webApp.badgeTitle')}
                googlePlayLabel={tDownload('mobileApps.googlePlay')}
                appStoreLabel={tDownload('mobileApps.appStore')}
                webAppUrl={WEB_APP_STUDIO_URL}
                analyticsParams={{ section: 'studio', placement: 'hero_cta' }}
                className="sm:justify-start"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="how-studio-works" className="scroll-mt-24 bg-white py-12 dark:bg-gray-950 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              {t('steps.eyebrow')}
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">{t('steps.title')}</h2>
            <p className="mt-3 text-lg leading-8 text-gray-700 dark:text-gray-300">{t('steps.description')}</p>
          </div>
          <ol className="mt-8 grid gap-5 md:grid-cols-3">
            {stepKeys.map((key, index) => (
              <li key={key} className="rounded-2xl border border-gray-200 p-6 dark:border-gray-800">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-container text-sm font-bold text-on-primary-container">
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
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              {t('starts.eyebrow')}
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">{t('starts.title')}</h2>
            <p className="mt-3 text-lg leading-8 text-gray-700 dark:text-gray-300">{t('starts.description')}</p>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {sourceKeys.map((key, index) => (
              <article key={key} className="rounded-3xl border border-gray-200 bg-white p-7 dark:border-gray-800 dark:bg-gray-950">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-container font-bold text-on-primary-container">
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

      <section className="bg-brand-950 py-12 text-white md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-200">{t('autoMode.eyebrow')}</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">{t('autoMode.title')}</h2>
            <p className="mt-4 text-lg leading-8 text-brand-100">{t('autoMode.description')}</p>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {(['photo', 'personal'] as const).map((key) => (
              <article key={key} className="rounded-3xl border border-white/15 bg-white/10 p-7 backdrop-blur">
                <h3 className="text-xl font-semibold">{t(`autoMode.${key}.title`)}</h3>
                <p className="mt-3 leading-7 text-brand-100">{t(`autoMode.${key}.description`)}</p>
              </article>
            ))}
          </div>
          <p className="mt-6 rounded-2xl bg-white px-5 py-4 font-semibold text-brand-950">{t('autoMode.control')}</p>
        </div>
      </section>

      <section className="bg-gray-50 py-12 dark:bg-gray-900 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight">{t('credits.title')}</h2>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            {([
              ['photo', studioPhotoCredits],
              ['personal', personalModelCosts.imageCredits],
            ] as const).map(([source, credits]) => (
              <div key={source} className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
                <dt className="font-medium text-gray-600 dark:text-gray-300">{t(`credits.${source}`)}</dt>
                <dd className="mt-2 text-2xl font-semibold tabular-nums">
                  {t('credits.perPhoto', { credits: new Intl.NumberFormat(locale).format(credits) })}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-sm leading-6 text-gray-600 dark:text-gray-400">{t('credits.note')}</p>
        </div>
      </section>

      <section className="bg-brand-950 py-12 text-white md:py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_460px] lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-200">{t('personal.eyebrow')}</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">{t('personal.title')}</h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-brand-100">{t('personal.description')}</p>
            <ul className="mt-7 space-y-4">
              {(['upload', 'train', 'create'] as const).map((key, index) => (
                <li key={key} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <span>
                    <span className="block font-semibold">{t(`personal.steps.${key}.title`)}</span>
                    <span className="mt-1 block leading-6 text-brand-100">{t(`personal.steps.${key}.description`)}</span>
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
                <p className="mt-1 text-sm leading-6 text-brand-100">
                  {t('personal.costs.standard.description', { credits: personalModelCosts.standardTrainingCredits })}
                </p>
              </div>
              <div className="rounded-2xl bg-black/15 p-4">
                <p className="font-semibold">{t('personal.costs.full.title')}</p>
                <p className="mt-1 text-sm leading-6 text-brand-100">
                  {t('personal.costs.full.description', { credits: personalModelCosts.fullTrainingCredits })}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-4 text-brand-950">
                <p className="font-semibold">{t('personal.costs.photos.title')}</p>
                <p className="mt-1 text-sm leading-6 text-brand-900">
                  {t('personal.costs.photos.description', { credits: personalModelCosts.imageCredits })}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-brand-100">{t('personal.costs.note')}</p>
          </div>
        </div>
      </section>

      <section className="bg-white py-12 dark:bg-gray-950 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
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
                  className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-300 px-5 py-2.5 font-semibold text-gray-900 transition hover:border-primary hover:text-primary dark:border-gray-700 dark:text-gray-100"
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
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">{t('faq.eyebrow')}</p>
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
              webAppEyebrow={tDownload('webApp.badgeEyebrow')}
              webAppTitle={tDownload('webApp.badgeTitle')}
              googlePlayLabel={tDownload('mobileApps.googlePlay')}
              appStoreLabel={tDownload('mobileApps.appStore')}
              webAppUrl={WEB_APP_STUDIO_URL}
              analyticsParams={{ section: 'studio', placement: 'bottom_cta' }}
            />
            <Link
              href={`${localePath(locale, '/')}#pricing`}
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-300 px-5 py-2.5 font-semibold text-gray-900 transition hover:border-primary hover:text-primary dark:border-gray-700 dark:text-gray-100"
            >
              {t('cta.secondary')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
