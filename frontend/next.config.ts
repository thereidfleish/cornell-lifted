import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // eslint: {
  //       ignoreDuringBuilds: true,
  //     },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://www.cornelllifted.com/api/:path*", // Flask prod server
      },
    ];
  },
};

export default nextConfig;
