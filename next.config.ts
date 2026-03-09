import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb', // Mengubah limit menjadi 2MB
    },
  },
};

export default nextConfig;