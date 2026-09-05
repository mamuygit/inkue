import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";
import { resolve } from "path";

loadEnvConfig(resolve(__dirname, "../.."));

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@mamuy/shared"],
  async rewrites() {
    const api = (process.env.API_INTERNAL_URL ?? "http://localhost:3001").replace(/\/$/, "");
    return [
      { source: "/api/v1/:path*", destination: `${api}/api/v1/:path*` },
      { source: "/r/:hash", destination: `${api}/r/:hash` },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "maiphlat.sgp1.digitaloceanspaces.com" },
      { protocol: "https", hostname: "sgp1.digitaloceanspaces.com" },
    ],
  },
};

export default nextConfig;
