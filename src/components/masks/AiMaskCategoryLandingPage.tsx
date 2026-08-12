import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import MasksCatalogBrowser, {
  type MasksCatalogLabels,
} from '@/components/masks/MasksCatalogBrowser';
import { AI_MASKS_APP_URL } from '@/lib/app-links';
import { canonicalUrl, localePath } from '@/lib/seo';
import { serializeJsonLd } from '@/lib/json-ld';
import type { AiMaskCategoryLanding, AiMasksCatalog } from '@/types/ai-mask';

type Props = {
  locale: string;
  landing: AiMaskCategoryLanding;
  catalog: AiMasksCatalog;
};

export default async function AiMaskCategoryLandingPage({ locale, landing, catalog }: Props) {
  const [t, tNav] = await Promise.all([
    getTranslations({ locale, namespace: 'masks' }),
    getTranslations({ locale, namespace: 'navigation' }),
  ]);
  const category = catalog.categories.find((item) => item.id === landing.categoryId);
  const masks = catalog.masks.filter((mask) => mask.categoryId === landing.categoryId);
  const categoryCatalog: AiMasksCatalog = {
    categories: category ? [category] : [],
    masks,
  };
  const pageUrl = canonicalUrl(locale, `/masks/${landing.slug}/`);
  const categoryName = category?.name || landing.title;
  const introductionParagraphs = landing.introduction
    .split(/\n\s*\n/u)
    .map((paragraph) => paragraph.replace(/\s*\n\s*/gu, ' ').trim())
    .filter(Boolean);
  const labels: MasksCatalogLabels = {
    after: t('after'),
    before: t('before'),
    categoryGuide: t('landing.categoryGuide'),
    categoryNav: t('categoryNav'),
    creditCost: t.raw('creditCost') as string,
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
  const jsonLdGraph: Array<Record<string, unknown>> = [
    {
      '@type': 'CollectionPage',
      '@id': `${pageUrl}#webpage`,
      url: pageUrl,
      name: landing.title,
      description: landing.description,
      inLanguage: locale,
      dateModified: landing.updatedAt,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: masks.length,
        itemListElement: masks.map((mask, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'Thing',
            '@id': `${pageUrl}#mask-${mask.slug}`,
            name: mask.name,
            image: mask.featuredGraphics,
          },
        })),
      },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${pageUrl}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: tNav('home'), item: canonicalUrl(locale, '/') },
        { '@type': 'ListItem', position: 2, name: t('breadcrumb'), item: canonicalUrl(locale, '/masks/') },
        { '@type': 'ListItem', position: 3, name: categoryName, item: pageUrl },
      ],
    },
  ];
  if (landing.faqs.length > 0) {
    jsonLdGraph.push({
      '@type': 'FAQPage',
      '@id': `${pageUrl}#faq`,
      mainEntity: landing.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: { '@type': 'Answer', text: faq.a },
      })),
    });
  }

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
          <p className="text-sm font-semibold uppercase tracking-wide text-purple-700 dark:text-purple-300">
            {categoryName}
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-5xl">
            {landing.title}
          </h1>
          <p className="mt-5 text-lg leading-8 text-gray-700 dark:text-gray-300">{landing.description}</p>
          <a
            href={AI_MASKS_APP_URL}
            className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-purple-700"
          >
            {t('tryMasks')}
          </a>
        </header>

        <section className="mt-12 max-w-4xl" aria-labelledby="mask-category-about">
          <h2 id="mask-category-about" className="text-2xl font-bold text-gray-950 dark:text-white">
            {t('landing.aboutTitle')}
          </h2>
          <div className="mt-4 space-y-4 text-base leading-7 text-gray-700 dark:text-gray-300">
            {introductionParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
        </section>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {([
            [t('landing.photoGuidanceTitle'), landing.photoGuidance],
            [t('landing.expectationsTitle'), landing.expectations],
            [t('landing.limitationsTitle'), landing.limitations],
          ] as const).map(([heading, items]) => (
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

        {category && masks.length > 0 ? (
          <section className="mt-14" aria-labelledby="current-category-masks">
            <h2 id="current-category-masks" className="text-3xl font-bold text-gray-950 dark:text-white">
              {t('landing.masksTitle')}
            </h2>
            <p className="mt-3 max-w-3xl text-gray-700 dark:text-gray-300">
              {t('landing.masksDescription')}
            </p>
            <div className="mt-8">
              <MasksCatalogBrowser
                catalog={categoryCatalog}
                labels={labels}
                locale={locale}
              />
            </div>
          </section>
        ) : null}

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
      </article>
    </div>
  );
}
