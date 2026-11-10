/** @type {import('next').NextConfig} */
const config = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  async rewrites() {
    return [{ source: '/api/v1/:path*', destination: `${process.env.API_ORIGIN || 'http://127.0.0.1:4000'}/api/v1/:path*` }, { source: '/backend/:path*', destination: `${process.env.API_ORIGIN || 'http://127.0.0.1:4000'}/api/v1/:path*` }];
  },
};
export default config;
