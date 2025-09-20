'use client';

import React from 'react';

type Props = {
  idUrl: string; // canonical page URL without hash
  name: string;
  description?: string | null;
  imageUrls?: string[];
  brandName?: string;
  priceCurrency?: string;
  perImagePrice?: string; // e.g. "0.03"
  oneTimeTrainingPrice?: string; // e.g. "2.99"
};

export default function UseCaseProductJsonLd({
  idUrl,
  name,
  description,
  imageUrls,
  brandName = 'My AI Photo Shoot',
  priceCurrency = 'USD',
  perImagePrice = '0.03',
  oneTimeTrainingPrice = '2.99',
}: Props) {
  const images = Array.isArray(imageUrls)
    ? imageUrls.filter(Boolean)
    : [];

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${idUrl}#product`,
    name,
    description: description || undefined,
    image: images.length ? images.slice(0, 10) : undefined,
    brand: { '@type': 'Organization', name: brandName },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency,
      lowPrice: perImagePrice,
      offerCount: '2',
      offers: [
        { '@type': 'Offer', name: 'Per Image', price: perImagePrice, url: 'https://app.myaiphotoshoot.com' },
        { '@type': 'Offer', name: 'One-time Training', price: oneTimeTrainingPrice, url: 'https://app.myaiphotoshoot.com' },
      ],
    },
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
  );
}


