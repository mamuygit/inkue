import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";
import { resolve } from "path";

loadEnvConfig(resolve(__dirname, "../.."));

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@mamuy/shared"],
  async rewrites() {
    const api = (process.env.API_INTERNAL_URL ?? "http://localhost:3001").replace(/\/$/, "");
    return [{ source: "/api/v1/:path*", destination: `${api}/api/v1/:path*` }];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "maiphlat.sgp1.digitaloceanspaces.com" },
      { protocol: "https", hostname: "sgp1.digitaloceanspaces.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/og.png",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, immutable" },
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
      {
        source: "/favicon.ico",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400" }],
      },
      {
        source: "/favicon-48x48.png",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400" }],
      },
      {
        source: "/llms.txt",
        headers: [{ key: "Content-Type", value: "text/plain; charset=utf-8" }],
      },
      {
        source: "/llms-full.txt",
        headers: [{ key: "Content-Type", value: "text/plain; charset=utf-8" }],
      },
    ];
  },
};

export default nextConfig;
