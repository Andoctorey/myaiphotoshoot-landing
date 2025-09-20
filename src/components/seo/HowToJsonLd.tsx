'use client';

import React from 'react';

type HowToStepInput = {
  name: string;
  text?: string | null;
  url?: string;
  image?: string;
};

type Props = {
  idUrl: string; // canonical page URL without hash
  name: string; // e.g. "How It Works - AI Headshots"
  description?: string | null;
  steps: HowToStepInput[];
};

export default function HowToJsonLd({ idUrl, name, description, steps }: Props) {
  const normalizedSteps = (Array.isArray(steps) ? steps : [])
    .filter(s => s && s.name)
    .map(step => ({
      '@type': 'HowToStep',
      name: step.name,
      text: step.text || undefined,
      url: step.url || undefined,
      image: step.image || undefined,
    }));

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    '@id': `${idUrl}#howto`,
    name,
    description: description || undefined,
    step: normalizedSteps,
    mainEntityOfPage: idUrl,
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
  );
}


