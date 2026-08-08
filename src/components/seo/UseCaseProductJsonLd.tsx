'use client';

import React from 'react';
import { serializeJsonLd } from '@/lib/json-ld';
import { buildDigitalOfferPolicies } from '@/lib/product-offer';
import { useTranslations } from '@/lib/utils';

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
  const t = useTranslations('useCase');
  const images = Array.isArray(imageUrls)
    ? imageUrls.filter(Boolean)
    : [];
  const offerPolicies = buildDigitalOfferPolicies();

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${idUrl}#service`,
    name,
    serviceType: t('schema.serviceType'),
    description: description || undefined,
    image: images.length ? images.slice(0, 10) : undefined,
    inLanguage: inLanguage || undefined,
    mainEntityOfPage: idUrl,
    provider: { '@type': 'Organization', name: brandName },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: t('pricingCard.title'),
      itemListElement: [
        {
          '@type': 'Offer',
          name: t('badges.oneTimeCredits'),
          url: 'https://app.myaiphotoshoot.com',
          itemOffered: {
            '@type': 'Service',
            name: t('pricingCard.payg'),
          },
          ...offerPolicies,
        },
        {
          '@type': 'Offer',
          name: 'Pro',
          url: 'https://app.myaiphotoshoot.com',
          itemOffered: {
            '@type': 'Service',
            name: t('pricingCard.pro'),
          },
          ...offerPolicies,
        },
        {
          '@type': 'Offer',
          name: 'Max',
          url: 'https://app.myaiphotoshoot.com',
          itemOffered: {
            '@type': 'Service',
            name: t('pricingCard.max'),
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
