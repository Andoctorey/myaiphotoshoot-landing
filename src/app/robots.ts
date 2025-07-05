import { MetadataRoute } from 'next'

/**
 * Robots.txt generator
 * 
 * CLOUDFLARE PAGES NOTE:
 * This generates a robots.txt file dynamically on Cloudflare Pages.
 */

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