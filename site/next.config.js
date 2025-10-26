const isProd = process.env.NODE_ENV === "production";
const repo = "vscode-profile-composer";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  output: "export",
  poweredByHeader: false,
  trailingSlash: true,
};

module.exports = nextConfig;
