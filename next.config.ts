import type {NextConfig} from 'next';

// @ts-ignore
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
    // eiofjsiof
      urlPattern: /^https?.*/, 
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
  ],
});

const nextConfig: NextConfig = {
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'a.tile.openstreetmap.org',
        port: '',
        pathname: '/**',
      },
       {
        protocol: 'https',
        hostname: 'b.tile.openstreetmap.org',
        port: '',
        pathname: '/**',
      },
       {
        protocol: 'https',
        hostname: 'c.tile.openstreetmap.org',
        port: '',
        pathname: '/**',
      },
       {
        protocol: 'https',
        hostname: 'a.basemaps.cartocdn.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'b.basemaps.cartocdn.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'c.basemaps.cartocdn.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn-icons-png.flaticon.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_OPENROUTESERVICE_API_KEY: process.env.OPENROUTESERVICE_API_KEY,
  }
};

export default withPWA(nextConfig);
