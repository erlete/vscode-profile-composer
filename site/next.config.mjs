/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
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
