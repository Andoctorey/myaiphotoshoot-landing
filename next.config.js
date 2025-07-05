// @ts-check

const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin();

/**
 * Next.js configuration for Cloudflare Pages
 * 
 * DEPLOYMENT: This project is deployed on Cloudflare Pages with native Next.js support
 * 
 * Benefits of Cloudflare Pages + Next.js:
 * - Edge Runtime: Runs on Cloudflare Workers for ultra-fast performance
 * - Dynamic routing: Blog posts load dynamically without pre-generation
 * - SSR support: Perfect SEO with server-side rendering
 * - Global CDN: Automatic caching and optimization
 * - No build-time limitations: Content updates instantly
 * 
 * Build Settings for Cloudflare Pages:
 * - Build command: npm run build
 * - Build output directory: .next
 * - Node.js version: 18+
 * 
 * Environment variables required:
 * - NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.myaiphotoshoot.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'myaiphotoshoot.b-cdn.net',
        pathname: '**',
      },
    ],
  },
};

module.exports = withNextIntl(nextConfig);
