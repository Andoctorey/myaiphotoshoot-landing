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
  priceCurrency?: string;
  perImageLowPrice?: string;
  perImageHighPrice?: string;
  trainingLowPrice?: string;
  trainingHighPrice?: string;
  inLanguage?: string;
};

export default function UseCaseProductJsonLd({
  idUrl,
  name,
  description,
  imageUrls,
  brandName = 'My AI Photo Shoot',
  priceCurrency = 'USD',
  perImageLowPrice = '0.03',
  perImageHighPrice = '0.29',
  trainingLowPrice = '5.99',
  trainingHighPrice = '9.99',
  inLanguage,
}: Props) {
  const images = Array.isArray(imageUrls)
    ? imageUrls.filter(Boolean)
    : [];
  const offerPolicies = buildDigitalOfferPolicies({
    priceCurrency,
    policyUrl: 'https://myaiphotoshoot.com/legal/',
  });

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${idUrl}#product`,
    name,
    description: description || undefined,
    image: images.length ? images.slice(0, 10) : undefined,
    inLanguage: inLanguage || undefined,
    mainEntityOfPage: idUrl,
    brand: { '@type': 'Organization', name: brandName },
    offers: [
      {
        '@type': 'AggregateOffer',
        name: 'Per-image generation',
        priceCurrency,
        lowPrice: perImageLowPrice,
        highPrice: perImageHighPrice,
        offerCount: '10',
        url: 'https://app.myaiphotoshoot.com',
        ...offerPolicies,
      },
      {
        '@type': 'AggregateOffer',
        name: 'One-time personal AI model training',
        priceCurrency,
        lowPrice: trainingLowPrice,
        highPrice: trainingHighPrice,
        offerCount: '2',
        url: 'https://app.myaiphotoshoot.com',
        ...offerPolicies,
      },
    ],
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
  );
}
