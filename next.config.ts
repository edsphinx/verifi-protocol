import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
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

export default nextConfig;
