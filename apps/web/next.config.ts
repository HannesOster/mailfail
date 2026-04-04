import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@mailfail/db", "@mailfail/shared"],
};

export default nextConfig;
