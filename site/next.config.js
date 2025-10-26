const isProd = process.env.NODE_ENV === "production";
const repo = "vscode-profile-composer";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  output: "export",
  poweredByHeader: false,
  trailingSlash: true,
  async redirects() {
    return [
      {
        source: "/profiles/:path*",
        destination: "/gists/:path*",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
