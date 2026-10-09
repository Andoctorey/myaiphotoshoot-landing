'use client';

import React from 'react';
import { serializeJsonLd } from '@/lib/json-ld';
import { useTranslations } from '@/lib/utils';

type Props = {
  idUrl: string; // canonical page URL without hash
  name: string;
  description?: string | null;
  imageUrls?: string[];
  brandName?: string;
};

export default function UseCaseProductJsonLd({
  idUrl,
  name,
  description,
  imageUrls,
  brandName = 'My AI Photoshoot',
}: Props) {
  const t = useTranslations('useCase');
  const images = Array.isArray(imageUrls)
    ? imageUrls.filter(Boolean)
    : [];

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${idUrl}#service`,
    name,
    serviceType: t('schema.serviceType'),
    description: description || undefined,
    image: images.length ? images.slice(0, 10) : undefined,
    mainEntityOfPage: idUrl,
    provider: { '@type': 'Organization', name: brandName },
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
  );
}
