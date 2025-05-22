// @ts-check

const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin();

/**
 * Next.js configuration
 * 
 * IMPORTANT: This project is deployed on Cloudflare Pages which requires static export.
 * We use 'output: export' to generate static files without server-side rendering.
 * All routes must be compatible with static generation.
 */
const nextConfig = {
  output: 'export', // Required for Cloudflare Pages static hosting
  trailingSlash: true, // Helps with static export route matching

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
  
  // Increase memory and timeout limits to handle large static site generation
  experimental: {
    // Increase parallel workers based on memory
    memoryBasedWorkersCount: true,
  },
  
  // Removed rewrites section as it's not compatible with static export
};

module.exports = withNextIntl(nextConfig);
