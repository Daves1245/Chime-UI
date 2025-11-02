import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  output: process.env.BUILD_TARGET === 'electron' ? 'export' : undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Remove assetPrefix for Electron builds to avoid font loading issues
  // Electron will handle relative paths correctly without this
};

export default nextConfig;
