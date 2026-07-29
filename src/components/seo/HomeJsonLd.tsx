import { getTranslations } from 'next-intl/server';
import { serializeJsonLd } from '@/lib/json-ld';
import { buildDigitalOfferPolicies } from '@/lib/product-offer';
import { canonicalUrl } from '@/lib/seo';

export default async function HomeJsonLd({ locale }: { locale: string }) {
  const tHero = await getTranslations({ locale, namespace: 'hero' });
  const description = tHero('description');
  const offerPolicies = buildDigitalOfferPolicies();
  const pricingUrl = `${canonicalUrl(locale, '/')}#pricing`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${canonicalUrl(locale, '/')}#service`,
    name: 'My AI Photo Shoot AI photo service',
    serviceType: 'AI headshot, portrait, and photo generation',
    provider: {
      '@type': 'Organization',
      '@id': 'https://myaiphotoshoot.com/#organization',
      name: 'My AI Photo Shoot',
    },
    description,
    url: canonicalUrl(locale, '/'),
    image: 'https://myaiphotoshoot.com/og-image-v2.jpg?v=3',
    category: 'AI headshot and portrait software',
    inLanguage: locale,
    isRelatedTo: [
      {
        '@type': 'MobileApplication',
        name: 'My AI Photo Shoot',
        operatingSystem: 'iOS, Android',
        applicationCategory: 'Photo & Video',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', ...offerPolicies },
        sameAs: [
          'https://apps.apple.com/app/id6744860178',
          'https://play.google.com/store/apps/details?id=com.myaiphotoshoot'
        ]
      }
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Credits and subscription plans',
      itemListElement: [
        {
          '@type': 'Offer',
          name: 'One-time credits',
          category: 'Pay as you go',
          url: pricingUrl,
          itemOffered: {
            '@type': 'Service',
            name: '1K AI photo generation with one-time credits',
          },
          ...offerPolicies,
        },
        {
          '@type': 'Offer',
          name: 'Pro',
          category: 'Subscription',
          url: pricingUrl,
          itemOffered: {
            '@type': 'Service',
            name: 'Up to 2K AI photo generation and Standard personal AI training',
          },
          ...offerPolicies,
        },
        {
          '@type': 'Offer',
          name: 'Max',
          category: 'Subscription',
          url: pricingUrl,
          itemOffered: {
            '@type': 'Service',
            name: 'Up to 4K AI photo generation and Full personal AI training',
          },
          ...offerPolicies,
        },
      ],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
    />
  );
}
