import { getTranslations } from 'next-intl/server';
import { serializeJsonLd } from '@/lib/json-ld';
import { buildDigitalOfferPolicies } from '@/lib/product-offer';
import { canonicalUrl } from '@/lib/seo';

export default async function HomeJsonLd({ locale }: { locale: string }) {
  const tHero = await getTranslations({ locale, namespace: 'hero' });
  const description = tHero('description');
  const offerPolicies = buildDigitalOfferPolicies({
    priceCurrency: 'USD',
    policyUrl: canonicalUrl(locale, '/legal/'),
  });
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'AI Headshot Generator',
    brand: { '@type': 'Brand', name: 'My AI Photo Shoot' },
    description,
    url: canonicalUrl(locale, '/'),
    image: 'https://myaiphotoshoot.com/og-image.png',
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
    offers: [
      {
        '@type': 'Offer',
        name: 'One-time AI training fee',
        price: '2.99',
        priceCurrency: 'USD',
        url: `${canonicalUrl(locale, '/')}#pricing`,
        ...offerPolicies,
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
        url: `${canonicalUrl(locale, '/')}#pricing`,
        ...offerPolicies,
      }
    ],
    aggregateRating: undefined
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
    />
  );
}
