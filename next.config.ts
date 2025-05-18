import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin();

/**
 * Next.js configuration
 * 
 * IMPORTANT: This project is deployed on Cloudflare Pages which requires static export.
 * We use 'output: export' to generate static files without server-side rendering.
 * All routes must be compatible with static generation.
 */
const nextConfig: NextConfig = {
  output: 'export', // Required for Cloudflare Pages static hosting

  /* config options here */
  images: {
    unoptimized: true, // Required for static export - disables Image Optimization API
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
  // Removed rewrites section as it's not compatible with static export
};

export default withNextIntl(nextConfig);
