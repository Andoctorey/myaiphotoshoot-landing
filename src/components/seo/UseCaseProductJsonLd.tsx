'use client';

import React from 'react';
import { serializeJsonLd } from '@/lib/json-ld';
import { buildDigitalOfferPolicies } from '@/lib/product-offer';

type Props = {
  idUrl: string; // canonical page URL without hash
  name: string;
  description?: string | null;
  imageUrls?: string[];
  brandName?: string;
  inLanguage?: string;
};

export default function UseCaseProductJsonLd({
  idUrl,
  name,
  description,
  imageUrls,
  brandName = 'My AI Photo Shoot',
  inLanguage,
}: Props) {
  const images = Array.isArray(imageUrls)
    ? imageUrls.filter(Boolean)
    : [];
  const offerPolicies = buildDigitalOfferPolicies();

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${idUrl}#service`,
    name,
    serviceType: 'AI photo generation',
    description: description || undefined,
    image: images.length ? images.slice(0, 10) : undefined,
    inLanguage: inLanguage || undefined,
    mainEntityOfPage: idUrl,
    provider: { '@type': 'Organization', name: brandName },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Ways to create',
      itemListElement: [
        {
          '@type': 'Offer',
          name: 'One-time credits',
          url: 'https://app.myaiphotoshoot.com',
          itemOffered: {
            '@type': 'Service',
            name: '1K AI photo generation',
          },
          ...offerPolicies,
        },
        {
          '@type': 'Offer',
          name: 'Pro',
          url: 'https://app.myaiphotoshoot.com',
          itemOffered: {
            '@type': 'Service',
            name: 'Up to 2K generation and Standard personal AI training',
          },
          ...offerPolicies,
        },
        {
          '@type': 'Offer',
          name: 'Max',
          url: 'https://app.myaiphotoshoot.com',
          itemOffered: {
            '@type': 'Service',
            name: 'Up to 4K generation and Full personal AI training',
          },
          ...offerPolicies,
        },
      ],
    },
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
  );
}
