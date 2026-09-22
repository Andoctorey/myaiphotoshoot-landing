import { PresetExperimentProvider, PresetExperimentImage, PresetExperimentLink, PresetExperimentPrice } from './PresetExperiment';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { buildPresetAppUrl, buildPresetDescription } from '@/lib/ai-presets';
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
  const subtitle = preset.subtitle?.trim();
  const pageUrl = canonicalUrl(locale, `/presets/${preset.slug}/`);
  const appUrl = buildPresetAppUrl(preset.slug);
  const imageUrls = preset.featured_graphics ? [preset.featured_graphics] : [];
  const imageAlt = preset.featured_graphics_alt?.trim() || t('imageAlt', { name: preset.name });
  const introParagraphs = splitParagraphs(preset.seo_intro);
  const seoSections = preset.seo_sections ?? [];
  const faqItems = preset.faqs ?? [];
  const hasDetails = introParagraphs.length > 0 || seoSections.length > 0 || faqItems.length > 0;
  const tryPresetLabel = t('tryPreset');

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
    <PresetExperimentProvider key={preset.id} presetId={preset.id} appUrl={appUrl} image={preset.featured_graphics || ''} alt={imageAlt} credits={preset.cost_credits ?? null} locale={locale}>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />

      <article className="mx-auto max-w-6xl px-4 pb-14 sm:px-6 lg:px-8">
        {/* SiteShell reserves 4rem for the fixed navigation above this viewport-sized hero. */}
        <div className="flex h-[calc(100svh-4rem)] min-h-[36rem] flex-col gap-5 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:gap-6 sm:pt-6">
          <nav aria-label="Breadcrumb" className="shrink-0 text-sm">
            <ol className="flex flex-wrap items-center gap-2 text-gray-600 dark:text-gray-300">
              <li>
                <Link href={localePath(locale, '/')} className="hover:text-primary">
                  {tNav('home')}
                </Link>
              </li>
              <li aria-hidden="true" className="text-gray-400">/</li>
              <li>
                <Link href={localePath(locale, '/presets/')} className="hover:text-primary">
                  {t('breadcrumb')}
                </Link>
              </li>
              <li aria-hidden="true" className="text-gray-400">/</li>
              <li aria-current="page" className="text-gray-800 dark:text-gray-200">{preset.name}</li>
            </ol>
          </nav>

          <header className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col items-center gap-5 text-center sm:gap-6">
            <div className="max-w-2xl shrink-0">
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-950 dark:text-white sm:text-4xl">
                {preset.name}
              </h1>
              {subtitle ? (
                <p className="mt-3 text-base leading-7 text-gray-600 dark:text-gray-300 sm:text-lg">
                  {subtitle}
                </p>
              ) : null}
            </div>

            <PresetExperimentLink
              href={appUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={tryPresetLabel}
              className="relative block min-h-0 w-full flex-1 rounded-[28px] outline-offset-4 focus-visible:outline-2 focus-visible:outline-primary"
            >
              {preset.featured_graphics ? (
                <PresetExperimentImage
                  width={960}
                  height={720}
                  sizes="(min-width: 816px) 768px, (min-width: 640px) calc(100vw - 48px), calc(100vw - 32px)"
                  priority
                  className="absolute inset-0 m-auto block h-auto max-h-full w-auto max-w-full rounded-[28px]"
                />
              ) : (
                <div className="absolute inset-0 m-auto flex h-full max-h-64 w-full max-w-64 items-center justify-center rounded-[28px] bg-gray-100 text-6xl font-semibold text-gray-400 dark:bg-gray-900 dark:text-gray-600">
                  {preset.name.charAt(0).toUpperCase()}
                </div>
              )}
            </PresetExperimentLink>

            <PresetExperimentLink
              href={appUrl}
              className="inline-flex min-h-14 w-full max-w-[420px] shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-semibold text-on-primary transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              {tryPresetLabel}
              <PresetExperimentPrice />
            </PresetExperimentLink>
          </header>
        </div>

        {hasDetails ? (
          <div className="mx-auto max-w-3xl space-y-10 border-t border-gray-200 pt-10 dark:border-gray-800 sm:space-y-12 sm:pt-12">
            {introParagraphs.length > 0 ? (
              <section aria-labelledby="preset-about-title">
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

            {seoSections.map((section, index) => {
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

            {faqItems.length > 0 && (
              <section aria-labelledby="preset-faq-title">
                <h2 id="preset-faq-title" className="text-xl font-semibold text-gray-950 dark:text-white">
                  {t('faqTitle', { name: preset.name })}
                </h2>
                <div className="mt-4 divide-y divide-gray-200 rounded-md border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
                  {faqItems.map((faq) => (
                    <details key={faq.q} className="group [&_summary::-webkit-details-marker]:hidden">
                      <summary className="flex cursor-pointer items-start justify-between gap-4 p-4">
                        <span className="font-semibold text-gray-950 dark:text-white">{faq.q}</span>
                        <span className="mt-0.5 text-lg leading-none text-primary group-open:hidden" aria-hidden="true">
                          +
                        </span>
                        <span className="mt-0.5 hidden text-lg leading-none text-primary group-open:inline" aria-hidden="true">
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
                    <PresetExperimentLink
                      href={appUrl}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-on-primary transition hover:bg-primary/90"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {tryPresetLabel}
                      <PresetExperimentPrice />
                    </PresetExperimentLink>
                  </div>
                </div>
              </section>
            )}
          </div>
        ) : null}
      </article>
    </div>
    </PresetExperimentProvider>
  );
}
