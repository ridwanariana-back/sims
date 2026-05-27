import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Mengubah limit menjadi 2MB
    },
  },
};

export default nextConfig;