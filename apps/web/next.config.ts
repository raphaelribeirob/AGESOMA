import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@agesoma/core", "@agesoma/db"]
};

export default nextConfig;
