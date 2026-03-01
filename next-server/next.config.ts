import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable experimental features for better streaming support
  experimental: {
    // Optimize server-side streaming
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Disable response caching for streaming routes
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'X-Accel-Buffering',
            value: 'no', // Disable nginx buffering
          },
        ],
      },
    ];
  },
};

export default nextConfig;
