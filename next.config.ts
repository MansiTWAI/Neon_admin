import type { NextConfig } from 'next';

const apiUrl = process.env.API_URL ?? 'http://localhost:4000';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    return [{ source: '/v1/:path*', destination: `${apiUrl}/v1/:path*` }];
  },
};

export default nextConfig;
