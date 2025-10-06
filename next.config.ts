import type { NextConfig } from "next";

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tapp.exchange",
      },
      {
        protocol: "https",
        hostname: "nodit.io",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push(
        "@aptos-labs/aptos-client",
        "got",
        "cacheable-request",
        "keyv",
      );
    }
    return config;
  },
};

export default withBundleAnalyzer(nextConfig);
