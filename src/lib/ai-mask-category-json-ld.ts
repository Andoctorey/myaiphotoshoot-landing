import { canonicalUrl } from '@/lib/seo';
import type { AiMask, AiMaskCategoryLanding } from '@/types/ai-mask';

type Input = {
  categoryName: string;
  homeLabel: string;
  landing: AiMaskCategoryLanding;
  locale: string;
  masks: readonly AiMask[];
  masksLabel: string;
  pageUrl: string;
};

export function buildMaskCategoryJsonLdGraph({
  categoryName,
  homeLabel,
  landing,
  locale,
  masks,
  masksLabel,
  pageUrl,
}: Input): Array<Record<string, unknown>> {
  const graph: Array<Record<string, unknown>> = [
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
        { '@type': 'ListItem', position: 1, name: homeLabel, item: canonicalUrl(locale, '/') },
        { '@type': 'ListItem', position: 2, name: masksLabel, item: canonicalUrl(locale, '/masks/') },
        { '@type': 'ListItem', position: 3, name: categoryName, item: pageUrl },
      ],
    },
  ];

  if (landing.faqs.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${pageUrl}#faq`,
      mainEntity: landing.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: { '@type': 'Answer', text: faq.a },
      })),
    });
  }

  return graph;
}
