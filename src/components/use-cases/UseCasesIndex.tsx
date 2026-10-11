import Image from 'next/image';
import Link from 'next/link';
import { env } from '@/lib/env';
import { serializeJsonLd } from '@/lib/json-ld';
import { BASE_URL, canonicalUrl, localePath } from '@/lib/seo';
import { fetchUseCasesIndexItems } from '@/lib/use-cases-index';

type Props = {
  locale: string;
  title: string;
  intro: string;
  emptyLabel: string;
};

export default async function UseCasesIndex({ locale, title, intro, emptyLabel }: Props) {
  const items = await fetchUseCasesIndexItems(env.SUPABASE_FUNCTIONS_URL, locale);
  const pageUrl = canonicalUrl(locale, '/use-cases/');
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${pageUrl}#webpage`,
    name: title,
    description: intro,
    url: pageUrl,
    inLanguage: locale,
    isPartOf: { '@id': `${BASE_URL}/#website` },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: items.length,
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.title,
        url: canonicalUrl(locale, `/use-cases/${item.slug}/`),
      })),
    },
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-3">{title}</h1>
      <p className="max-w-3xl text-base leading-7 text-gray-600 mb-8">{intro}</p>
      {items.length === 0 ? (
        <div className="text-gray-600">{emptyLabel}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((it) => (
            <Link
              key={it.slug}
              href={localePath(locale, `/use-cases/${it.slug}/`)}
              className="block rounded-xl group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {Array.isArray(it.featured_image_urls) && it.featured_image_urls[0] && (
                  <Image src={it.featured_image_urls[0]} alt={it.title} width={640} height={360} className="w-full h-auto" />
                )}
                <div className="p-4">
                  <h2 className="text-lg font-semibold text-gray-900 group-hover:underline">{it.title}</h2>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
