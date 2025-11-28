import type { NextConfig } from "next";
import { withPostHogConfig } from "@posthog/nextjs-config";


const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  allowedDevOrigins: [
    "https://cornelllifted.com"
  ],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://api.cornelllifted.com/api/:path*", // Flask prod server
      },
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export default withPostHogConfig(nextConfig, {
  personalApiKey: process.env.POSTHOG_PERSONAL_API_KEY!, // Your personal API key from PostHog settings
  envId: '248648', // Your environment ID (project ID)
  sourcemaps: { // Optional
    enabled: true, // Optional: Enable sourcemaps generation and upload, defaults to true on production builds
  },
});
