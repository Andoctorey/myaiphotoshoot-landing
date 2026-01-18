import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';
import type { RemotePattern } from 'next/dist/shared/lib/image-config';

const withNextIntl = createNextIntlPlugin();
const isDev = process.env.NODE_ENV === 'development';

/**
 * Next.js configuration
 * 
 * IMPORTANT: This project is deployed on Cloudflare Pages which requires static export.
 * We use 'output: export' to generate static files without server-side rendering.
 * All routes must be compatible with static generation.
 */
const nextConfig: NextConfig = {
  ...(isDev ? {} : { output: 'export' }), // Keep export for Cloudflare Pages builds
  trailingSlash: true, // Helps with static export route matching

  /* config options here */
  images: {
    unoptimized: true, // Required for static export - disables Image Optimization API
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.myaiphotoshoot.com',
        pathname: '**',
      } as RemotePattern,
      {
        protocol: 'https',
        hostname: 'myaiphotoshoot.b-cdn.net',
        pathname: '**',
      } as RemotePattern,
    ],
  },
  
  // Increase memory and timeout limits to handle large static site generation
  experimental: {
    // Increase parallel workers based on memory
    memoryBasedWorkersCount: true,
  },
  
  // Removed rewrites section as it's not compatible with static export
};

export default withNextIntl(nextConfig); 