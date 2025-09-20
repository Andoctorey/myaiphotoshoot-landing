'use client';

import React from 'react';

type Props = {
  locale: string;
  title: string;
  description: string;
  url: string;
  imageUrl?: string | null;
  datePublished?: string | null;
  dateModified?: string | null;
  authorName?: string;
};

export default function ArticleJsonLd({
  locale,
  title,
  description,
  url,
  imageUrl,
  datePublished,
  dateModified,
  authorName = 'My AI Photo Shoot',
}: Props) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${url}#article`,
    headline: title,
    description,
    mainEntityOfPage: url,
    inLanguage: locale,
    image: imageUrl ? [imageUrl] : undefined,
    author: [{ '@type': 'Organization', name: authorName, url: 'https://myaiphotoshoot.com' }],
    publisher: {
      '@type': 'Organization',
      name: 'My AI Photo Shoot',
      url: 'https://myaiphotoshoot.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://myaiphotoshoot.com/images/icon_512.png',
        width: 512,
        height: 512,
      },
    },
    datePublished: datePublished || undefined,
    dateModified: dateModified || datePublished || undefined,
  } as const;

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
  );
}
