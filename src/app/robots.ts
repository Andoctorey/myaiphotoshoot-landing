import { MetadataRoute } from 'next'

/**
 * Robots.txt generator
 * 
 * STATIC EXPORT NOTE:
 * This generates a static robots.txt file at build time for Cloudflare Pages hosting.
 */

// Add static export configuration
export const dynamic = 'force-static';
export const revalidate = 3600; // 1 hour revalidation

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/'],
    },
    sitemap: 'https://myaiphotoshoot.com/sitemap.xml',
  }
} 