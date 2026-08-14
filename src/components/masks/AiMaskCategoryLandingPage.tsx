import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import AiMaskCategoryHighlights from '@/components/masks/AiMaskCategoryHighlights';
import { AI_MASKS_APP_URL } from '@/lib/app-links';
import { buildMaskCategoryJsonLdGraph } from '@/lib/ai-mask-category-json-ld';
import { canonicalUrl, localePath } from '@/lib/seo';
import { serializeJsonLd } from '@/lib/json-ld';
import type { AiMaskCategoryLanding, AiMasksCatalog } from '@/types/ai-mask';

type Props = {
  locale: string;
  landing: AiMaskCategoryLanding;
  catalog: AiMasksCatalog;
};

function splitIntroduction(introduction: string): string[] {
  return introduction
    .split(/\n\s*\n/u)
    .map((paragraph) => paragraph.replace(/\s*\n\s*/gu, ' ').trim())
    .filter(Boolean);
}

export default async function AiMaskCategoryLandingPage({ locale, landing, catalog }: Props) {
  const [t, tNav] = await Promise.all([
    getTranslations({ locale, namespace: 'masks' }),
    getTranslations({ locale, namespace: 'navigation' }),
  ]);
  const category = catalog.categories.find((item) => item.id === landing.categoryId);
  const masks = catalog.masks.filter((mask) => mask.categoryId === landing.categoryId);
  const pageUrl = canonicalUrl(locale, `/masks/${landing.slug}/`);
  const categoryName = category?.name || landing.title;
  const introductionParagraphs = splitIntroduction(landing.introduction);
  const jsonLdGraph = buildMaskCategoryJsonLdGraph({
    categoryName,
    homeLabel: tNav('home'),
    landing,
    locale,
    masks,
    masksLabel: t('breadcrumb'),
    pageUrl,
  });
  const guidanceSections = [
    { heading: t('landing.photoGuidanceTitle'), items: landing.photoGuidance },
    { heading: t('landing.expectationsTitle'), items: landing.expectations },
    { heading: t('landing.limitationsTitle'), items: landing.limitations },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd({ '@context': 'https://schema.org', '@graph': jsonLdGraph }) }}
      />

      <article className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-7 text-sm">
          <ol className="flex flex-wrap items-center gap-2 text-gray-600 dark:text-gray-300">
            <li>
              <Link
                href={localePath(locale, '/')}
                className="hover:text-purple-600 dark:hover:text-purple-400"
              >
                {tNav('home')}
              </Link>
            </li>
            <li aria-hidden="true" className="text-gray-400">/</li>
            <li>
              <Link
                href={localePath(locale, '/masks/')}
                className="hover:text-purple-600 dark:hover:text-purple-400"
              >
                {t('breadcrumb')}
              </Link>
            </li>
            <li aria-hidden="true" className="text-gray-400">/</li>
            <li aria-current="page" className="text-gray-900 dark:text-gray-100">
              {categoryName}
            </li>
          </ol>
        </nav>

        <header className="max-w-4xl">
          <h1 className="text-4xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-5xl">
            {landing.title}
          </h1>
          <p className="mt-5 text-lg leading-8 text-gray-700 dark:text-gray-300">{landing.description}</p>
        </header>

        {category ? (
          <AiMaskCategoryHighlights
            afterLabel={t('after')}
            beforeLabel={t('before')}
            category={category}
            femaleLabel={t('genderFemale')}
            genderLabel={t('genderLabel')}
            holdToCompareLabel={t('landing.holdToCompare')}
            maleLabel={t('genderMale')}
            masks={masks}
            resultAltLabel={t.raw('resultAlt') as string}
            tryMasksLabel={t('tryMasks')}
          />
        ) : null}

        <section className="mt-12 max-w-4xl" aria-labelledby="mask-category-about">
          <h2 id="mask-category-about" className="text-2xl font-bold text-gray-950 dark:text-white">
            {t('landing.aboutTitle')}
          </h2>
          <div className="mt-4 space-y-4 text-base leading-7 text-gray-700 dark:text-gray-300">
            {introductionParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
        </section>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {guidanceSections.map(({ heading, items }) => (
            <section key={heading} className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-xl font-bold text-gray-950 dark:text-white">{heading}</h2>
              <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-6 text-gray-700 dark:text-gray-300">
                {items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </section>
          ))}
        </div>

        <aside className="mt-10 max-w-4xl rounded-2xl bg-purple-50 p-6 dark:bg-purple-950/30">
          <h2 className="text-lg font-bold text-gray-950 dark:text-white">
            {t('landing.trainingQuestion')}
          </h2>
          <p className="mt-2 leading-7 text-gray-700 dark:text-gray-300">
            {t('landing.trainingAnswer')}
          </p>
        </aside>

        <section className="mt-14 max-w-4xl" aria-labelledby="mask-category-faq">
          <h2 id="mask-category-faq" className="text-2xl font-bold text-gray-950 dark:text-white">
            {t('landing.faqTitle')}
          </h2>
          <div className="mt-5 divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
            {landing.faqs.map((faq) => (
              <details key={faq.q} className="group p-5">
                <summary className="cursor-pointer font-semibold text-gray-950 dark:text-white">
                  {faq.q}
                </summary>
                <p className="mt-3 leading-7 text-gray-700 dark:text-gray-300">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-3xl bg-purple-100 px-6 py-9 text-center dark:bg-purple-950/40 sm:px-10">
          <h2 className="text-2xl font-bold text-gray-950 dark:text-white">
            {t('readyTitle')}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-gray-600 dark:text-gray-300">
            {t('readyDescription')}
          </p>
          <a
            href={AI_MASKS_APP_URL}
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-purple-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950"
          >
            {t('tryMasks')}
          </a>
        </section>
      </article>
    </div>
  );
}
