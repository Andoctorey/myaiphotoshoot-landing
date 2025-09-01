'use client';

export default function HomeJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'AI Photoshoot',
    brand: { '@type': 'Brand', name: 'My AI Photo Shoot' },
    description: 'Train a custom model once for $2.99, then generate images for ~$0.03 each.',
    url: 'https://myaiphotoshoot.com',
    image: 'https://myaiphotoshoot.com/og-image.png',
    category: 'Photography Software',
    isRelatedTo: [
      {
        '@type': 'MobileApplication',
        name: 'My AI Photo Shoot',
        operatingSystem: 'iOS, Android',
        applicationCategory: 'Photo & Video',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        sameAs: [
          'https://apps.apple.com/app/id6744860178',
          'https://play.google.com/store/apps/details?id=com.myaiphotoshoot'
        ]
      }
    ],
    offers: [
      {
        '@type': 'Offer',
        name: 'One-time AI training fee',
        price: '2.99',
        priceCurrency: 'USD',
        url: 'https://myaiphotoshoot.com/#pricing',
        availability: 'https://schema.org/InStock'
      },
      {
        '@type': 'Offer',
        name: 'Per-image generation',
        price: '0.03',
        priceCurrency: 'USD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '0.03',
          priceCurrency: 'USD',
          unitText: 'per image'
        },
        url: 'https://myaiphotoshoot.com/#pricing',
        availability: 'https://schema.org/InStock'
      }
    ],
    aggregateRating: undefined
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}



