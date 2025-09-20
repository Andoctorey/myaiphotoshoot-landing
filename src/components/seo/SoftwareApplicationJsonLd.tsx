'use client';

import React from 'react';

type Props = {
  idUrl: string; // canonical page URL without hash
  name: string;
  description?: string | null;
  applicationCategory?: string; // e.g. "Photo & Video"
};

export default function SoftwareApplicationJsonLd({
  idUrl,
  name,
  description,
  applicationCategory = 'Photo & Video',
}: Props) {
  const webApp = {
    '@type': 'WebApplication',
    name,
    applicationCategory,
    browserRequirements: 'Requires JavaScript. Works best on modern browsers.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    url: 'https://app.myaiphotoshoot.com',
  } as const;

  const iosApp = {
    '@type': 'MobileApplication',
    name: 'My AI Photo Shoot',
    operatingSystem: 'iOS',
    applicationCategory,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    downloadUrl: 'https://apps.apple.com/app/id6744860178',
    sameAs: ['https://apps.apple.com/app/id6744860178'],
  } as const;

  const androidApp = {
    '@type': 'MobileApplication',
    name: 'My AI Photo Shoot',
    operatingSystem: 'Android',
    applicationCategory,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    downloadUrl: 'https://play.google.com/store/apps/details?id=com.myaiphotoshoot',
    sameAs: ['https://play.google.com/store/apps/details?id=com.myaiphotoshoot'],
  } as const;

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': `${idUrl}#software`,
    name,
    description: description || undefined,
    applicationCategory,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    isRelatedTo: [webApp, iosApp, androidApp],
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
  );
}


