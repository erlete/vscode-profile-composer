/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  async headers() {
    const cors = [
      { key: 'Access-Control-Allow-Origin', value: '*' },
      { key: 'Access-Control-Allow-Methods', value: 'GET, OPTIONS' },
      {
        key: 'Access-Control-Allow-Headers',
        value: 'Content-Type, Authorization',
      },
      { key: 'Access-Control-Max-Age', value: '86400' },
      { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
    ]
    return [
      { source: '/gists/:path*', headers: cors },
      { source: '/api/compose/:path*', headers: cors },
    ]
  },
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  webpack(config, { isServer }) {
    if (!isServer) {
      config.resolve.fallback = { fs: false, path: false, os: false }
    }
    return config
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'static.erlete.dev',
        pathname: '/**',
      },
    ],
  },
}
