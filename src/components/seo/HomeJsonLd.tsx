import { getTranslations } from 'next-intl/server';
import { serializeJsonLd } from '@/lib/json-ld';
import { buildDigitalOfferPolicies } from '@/lib/product-offer';
import { canonicalUrl } from '@/lib/seo';

export default async function HomeJsonLd({ locale }: { locale: string }) {
  const [tHero, tHome, tPricing, tSchema] = await Promise.all([
    getTranslations({ locale, namespace: 'hero' }),
    getTranslations({ locale, namespace: 'pageCopy.home' }),
    getTranslations({ locale, namespace: 'pricing' }),
    getTranslations({ locale, namespace: 'useCase.schema' }),
  ]);
  const description = tHero('description');
  const offerPolicies = buildDigitalOfferPolicies();
  const pricingUrl = `${canonicalUrl(locale, '/')}#pricing`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${canonicalUrl(locale, '/')}#service`,
    name: `My AI Photo Shoot — ${tHome('shareTitle')}`,
    serviceType: tSchema('serviceType'),
    provider: {
      '@type': 'Organization',
      '@id': 'https://myaiphotoshoot.com/#organization',
      name: 'My AI Photo Shoot',
    },
    description,
    url: canonicalUrl(locale, '/'),
    image: 'https://myaiphotoshoot.com/og-image-v2.jpg?v=4',
    isRelatedTo: [
      {
        '@type': 'WebApplication',
        name: 'My AI Photo Shoot',
        applicationCategory: 'Photo & Video',
        url: 'https://app.myaiphotoshoot.com',
      },
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
      name: tPricing('title'),
      itemListElement: [
        {
          '@type': 'Offer',
          name: tPricing('plans.payg.name'),
          url: pricingUrl,
          itemOffered: {
            '@type': 'Service',
            name: tPricing('plans.payg.description'),
          },
          ...offerPolicies,
        },
        {
          '@type': 'Offer',
          name: tPricing('plans.pro.name'),
          url: pricingUrl,
          itemOffered: {
            '@type': 'Service',
            name: tPricing('plans.pro.description'),
          },
          ...offerPolicies,
        },
        {
          '@type': 'Offer',
          name: tPricing('plans.max.name'),
          url: pricingUrl,
          itemOffered: {
            '@type': 'Service',
            name: tPricing('plans.max.description'),
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
