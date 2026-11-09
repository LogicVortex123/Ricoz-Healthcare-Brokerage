import type { NextConfig } from 'next';

const apiProxy = (process.env.API_PROXY_URL || 'https://ricoz-healthcare-brokerage.onrender.com').replace(/\/$/, '');

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
