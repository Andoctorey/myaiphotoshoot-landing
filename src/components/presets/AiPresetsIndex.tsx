import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import AiPresetsGrid from '@/components/presets/AiPresetsGrid';
import {
  aiPresetsPagePath,
  fetchAiPresetsPage,
  type AiPresetsPage,
} from '@/lib/ai-presets';
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
              name: 'My AI Photoshoot',
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

      <div className="mx-auto max-w-7xl px-4 pt-6 pb-12 sm:px-6 sm:pt-8 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm">
          <ol className="flex flex-wrap items-center gap-2 text-gray-600 dark:text-gray-300">
            <li>
              <Link href={localePath(locale, '/')} className="hover:text-primary">
                {tNav('home')}
              </Link>
            </li>
            <li aria-hidden="true" className="text-gray-400">/</li>
            <li aria-current="page" className="text-gray-800 dark:text-gray-200">
              {t('breadcrumb')}
            </li>
          </ol>
        </nav>

        <AiPresetsGrid
          key={`${locale}-${presetsPage.page}`}
          locale={locale}
          initialPage={presetsPage}
          title={title}
          description={description}
          emptyLabel={t('empty')}
        />
      </div>
    </div>
  );
}
