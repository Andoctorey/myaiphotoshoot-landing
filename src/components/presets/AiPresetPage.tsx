import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { buildPresetAppUrl, buildPresetDescription, buildPresetProvidedDescription, formatPresetCostUsd } from '@/lib/ai-presets';
import { canonicalUrl, localePath } from '@/lib/seo';
import { serializeJsonLd } from '@/lib/json-ld';
import type { AiPreset } from '@/types/ai-preset';

type Props = {
  locale: string;
  preset: AiPreset;
};

function splitParagraphs(text?: string | null): string[] {
  return text
    ? text.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean)
    : [];
}

export default async function AiPresetPage({ locale, preset }: Props) {
  const t = await getTranslations({ locale, namespace: 'presets' });
  const tNav = await getTranslations({ locale, namespace: 'navigation' });
  const description = buildPresetDescription(preset);
  const providedDescription = buildPresetProvidedDescription(preset);
  const pageUrl = canonicalUrl(locale, `/presets/${preset.slug}/`);
  const appUrl = buildPresetAppUrl(preset.slug);
  const imageUrls = preset.featured_graphics ? [preset.featured_graphics] : [];
  const imageAlt = preset.featured_graphics_alt?.trim() || t('imageAlt', { name: preset.name });
  const introParagraphs = splitParagraphs(preset.seo_intro);
  const faqItems = preset.faqs || [];
  const formattedCost = formatPresetCostUsd(preset.cost, locale);
  const tryPresetLabel = formattedCost ? `${t('tryPreset')} · ${formattedCost}` : t('tryPreset');

  const jsonLdGraph: Array<Record<string, unknown>> = [
    {
      '@type': 'WebPage',
      '@id': `${pageUrl}#webpage`,
      url: pageUrl,
      name: `${preset.name} AI Preset`,
      description,
      inLanguage: locale,
      primaryImageOfPage: preset.featured_graphics
        ? { '@type': 'ImageObject', url: preset.featured_graphics, caption: imageAlt }
        : undefined,
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${pageUrl}#software`,
      name: `${preset.name} AI Preset`,
      applicationCategory: 'Photo & Video',
      operatingSystem: 'Web, iOS, Android',
      description,
      image: imageUrls.length ? imageUrls : undefined,
      url: appUrl,
      offers: formattedCost
        ? { '@type': 'Offer', price: preset.cost, priceCurrency: 'USD', url: appUrl }
        : undefined,
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${pageUrl}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: tNav('home'), item: canonicalUrl(locale, '/') },
        { '@type': 'ListItem', position: 2, name: t('breadcrumb'), item: canonicalUrl(locale, '/presets/') },
        { '@type': 'ListItem', position: 3, name: preset.name, item: pageUrl },
      ],
    },
  ];

  if (faqItems.length > 0) {
    jsonLdGraph.splice(2, 0, {
      '@type': 'FAQPage',
      '@id': `${pageUrl}#faq`,
      mainEntity: faqItems.map((faq) => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.a,
        },
      })),
    });
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': jsonLdGraph,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />

      <article className="mx-auto max-w-6xl px-4 pb-14 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-8 text-sm">
          <ol className="flex flex-wrap items-center gap-2 text-gray-600 dark:text-gray-300">
            <li>
              <Link href={localePath(locale, '/')} className="hover:text-purple-600 dark:hover:text-purple-400">
                {tNav('home')}
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li>
              <Link href={localePath(locale, '/presets/')} className="hover:text-purple-600 dark:hover:text-purple-400">
                {t('breadcrumb')}
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li aria-current="page" className="text-gray-800 dark:text-gray-200">{preset.name}</li>
          </ol>
        </nav>

        <header className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-purple-700 dark:text-purple-300">
              {t('quickPreset')}
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight text-gray-950 dark:text-white sm:text-[2.75rem]">
              {preset.name}
            </h1>
            {providedDescription ? (
              <p className="mt-4 max-w-2xl text-base leading-7 text-gray-700 dark:text-gray-300 sm:text-lg sm:leading-8">
                {providedDescription}
              </p>
            ) : null}
            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
              <a
                href={appUrl}
                className="inline-flex h-10 items-center justify-center rounded-md bg-purple-600 px-5 text-sm font-semibold text-white transition hover:bg-purple-700"
                target="_blank"
                rel="noopener noreferrer"
              >
                {tryPresetLabel}
              </a>
            </div>
          </div>

          <div className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            {preset.featured_graphics ? (
              <Image
                src={preset.featured_graphics}
                alt={imageAlt}
                width={720}
                height={720}
                sizes="(min-width: 1024px) 360px, 100vw"
                priority
                className="aspect-square w-full object-cover"
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center bg-gray-900 text-5xl font-semibold text-white dark:bg-gray-800">
                {preset.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </header>

        {introParagraphs.length > 0 ? (
          <section className="mt-10 max-w-3xl" aria-labelledby="preset-about-title">
            <h2 id="preset-about-title" className="text-2xl font-semibold leading-snug text-gray-950 dark:text-white">
              {t('aboutTitle')}
            </h2>
            <div className="mt-3 space-y-4 text-base leading-7 text-gray-700 dark:text-gray-300">
              {introParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ) : null}

        {preset.seo_sections && preset.seo_sections.length > 0 && (
          <section className="mt-10">
            <div className="max-w-3xl space-y-9">
              {preset.seo_sections.map((section, index) => {
                const headingId = `preset-section-${index}`;
                return (
                  <section key={section.heading} aria-labelledby={headingId}>
                    <h2
                      id={headingId}
                      className="text-2xl font-semibold leading-snug text-gray-950 dark:text-white"
                    >
                      {section.heading}
                    </h2>
                    <div className="mt-3 space-y-4 text-base leading-7 text-gray-700 dark:text-gray-300">
                      {section.body.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </section>
        )}

        {faqItems.length > 0 && (
          <section className="mt-14 max-w-3xl" aria-labelledby="preset-faq-title">
            <h2 id="preset-faq-title" className="text-xl font-semibold text-gray-950 dark:text-white">
              {t('faqTitle', { name: preset.name })}
            </h2>
            <div className="mt-4 divide-y divide-gray-200 rounded-md border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
              {faqItems.map((faq) => (
                <details key={faq.q} className="group [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer items-start justify-between gap-4 p-4">
                    <span className="font-semibold text-gray-950 dark:text-white">{faq.q}</span>
                    <span className="mt-0.5 text-lg leading-none text-purple-600 group-open:hidden dark:text-purple-300" aria-hidden="true">
                      +
                    </span>
                    <span className="mt-0.5 hidden text-lg leading-none text-purple-600 group-open:inline dark:text-purple-300" aria-hidden="true">
                      -
                    </span>
                  </summary>
                  <p className="px-4 pb-4 text-sm leading-6 text-gray-700 dark:text-gray-300">{faq.a}</p>
                </details>
              ))}
            </div>
            <div className="mt-8 border-t border-gray-200 pt-6 dark:border-gray-800">
              <p className="text-lg font-semibold text-gray-950 dark:text-white">{t('readyTitle')}</p>
              <p className="mt-2 text-sm leading-6 text-gray-700 dark:text-gray-300">{t('readyDescription')}</p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <a
                  href={appUrl}
                  className="inline-flex h-11 items-center justify-center rounded-md bg-purple-600 px-5 text-sm font-semibold text-white transition hover:bg-purple-700"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {tryPresetLabel}
                </a>
              </div>
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
