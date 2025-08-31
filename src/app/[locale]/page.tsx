import { locales, defaultLocale } from '@/i18n/request';
import LocalizedHomeClient from './LocalizedHomeClient';
import type { Metadata } from 'next';
import { env } from '@/lib/env';
import type { GalleryItem } from '@/types/gallery';
import type { BlogPostsResponse, BlogListItem } from '@/types/blog';

// Generate static params for all locales
export async function generateStaticParams() {
  return locales.map((locale) => ({
    locale,
  }));
}

export default async function LocalizedHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  // Fetch initial gallery items and blog posts at build time (static export)
  let initialGallery: GalleryItem[] = [];
  let initialBlog: BlogListItem[] = [];

  try {
    const [gRes, bRes] = await Promise.all([
      fetch(`${env.SUPABASE_FUNCTIONS_URL}/public-gallery?page=1&limit=24`, { next: { revalidate: 3600 } }),
      fetch(`${env.SUPABASE_FUNCTIONS_URL}/blog-posts?page=1&limit=6&locale=${locale}`, { next: { revalidate: 3600 } })
    ]);

    if (gRes.ok) {
      initialGallery = await gRes.json();
    }
    if (bRes.ok) {
      const blogJson = (await bRes.json()) as BlogPostsResponse;
      initialBlog = blogJson.posts || [];
    }
  } catch {
    // Non-fatal: fall back to empty; client will fetch
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'AI Photo Generation Service',
            serviceType: 'AI photo generation',
            description:
              'Create hyper-realistic AI-generated photos. One-time model training then pay-as-you-go per image.',
            provider: {
              '@type': 'Organization',
              name: 'My AI Photo Shoot',
              url: 'https://myaiphotoshoot.com',
            },
            areaServed: 'Worldwide',
            offers: [
              {
                '@type': 'Offer',
                name: 'Per-image generation',
                price: '0.03',
                priceCurrency: 'USD',
                priceSpecification: {
                  '@type': 'UnitPriceSpecification',
                  price: '0.03',
                  priceCurrency: 'USD',
                  unitText: 'per image',
                },
                availability: 'https://schema.org/InStock',
                url: 'https://myaiphotoshoot.com',
              },
              {
                '@type': 'Offer',
                name: 'One-time AI training fee',
                price: '2.99',
                priceCurrency: 'USD',
                category: 'Setup',
                availability: 'https://schema.org/InStock',
                url: 'https://myaiphotoshoot.com',
              },
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'MobileApplication',
            name: 'My AI Photo Shoot',
            operatingSystem: 'iOS, Android',
            applicationCategory: 'Photo & Video',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD'
            },
            downloadUrl: 'https://myaiphotoshoot.com',
            installUrl: 'https://myaiphotoshoot.com',
            url: 'https://myaiphotoshoot.com',
            availableOnDevice: 'iPhone, Android'
          })
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'My AI Photo Shoot',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'iOS, Android, Web',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD'
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.8',
              ratingCount: '1000'
            },
            url: 'https://myaiphotoshoot.com',
            sameAs: [
              'https://apps.apple.com/app/id6744860178',
              'https://play.google.com/store/apps/details?id=com.myaiphotoshoot'
            ]
          })
        }}
      />
      <LocalizedHomeClient initialGallery={initialGallery} initialBlog={initialBlog} />
    </>
  );
} 

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const baseUrl = 'https://myaiphotoshoot.com';
  const url = `${baseUrl}/${locale}`;
  return {
    alternates: {
      canonical: url,
      languages: {
        ...Object.fromEntries((locales as readonly string[]).map(l => [l, `/${l}`])),
        'x-default': `/${defaultLocale}`,
      },
    },
  };
}