import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16: Moved from experimental.serverComponentsExternalPackages
  serverExternalPackages: [
    "jsdom",
    "isomorphic-dompurify",
    // Payload CMS dependencies that must not be bundled by webpack
    "@libsql",
    "drizzle-kit",
    "payload",
    "@payloadcms/db-postgres",
  ],
  images: {
    contentDispositionType: 'inline',
    // loader: 'custom',
    // loaderFile: './src/utils/supabase-image-loader.ts',
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "odahbrkrhaturgyiuutu.supabase.co",
        pathname: '/**',
      },
      {
        protocol: "https",
        hostname: "odahbrkrhaturgyiuutu.storage.supabase.co",
        pathname: '/**',
      },
      {
        protocol: "https",
        hostname: "*.storage.supabase.co",
        pathname: '/**',
      },
      {
        protocol: "https",
        hostname: "styles.redditmedia.com",
        pathname: '/**',
      },
      {
        protocol: "https",
        hostname: "i.redd.it",
        pathname: '/**',
      },
      {
        protocol: "https",
        hostname: "b.thumbs.redditmedia.com",
        pathname: '/**',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // Dev performance optimizations
  experimental: {
    // Faster dev server
    optimizePackageImports: ['lucide-react'],
  },
};

import { withPayload } from '@payloadcms/next/withPayload'

export default withPayload(nextConfig);
