import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
  async redirects() {
    return [
      { source: "/projects", destination: "/portfolio", permanent: true },
      { source: "/projects/:id", destination: "/portfolio", permanent: true },
    ];
  },
};

export default nextConfig;
