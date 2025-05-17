import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

export default nextConfig;
