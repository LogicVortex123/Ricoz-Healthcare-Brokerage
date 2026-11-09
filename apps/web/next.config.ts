import type { NextConfig } from 'next';

const apiProxy = process.env.API_PROXY_URL || 'http://localhost:4000';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  agentRules: false,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiProxy}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
