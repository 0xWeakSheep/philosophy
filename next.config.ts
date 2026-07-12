import type { NextConfig } from "next";

function backendOrigin(): string | null {
  const configured = process.env.BACKEND_API_URL?.trim();
  if (!configured) return null;

  const url = new URL(configured);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("BACKEND_API_URL must use http or https");
  }
  return url.toString().replace(/\/$/u, "");
}

const remoteBackend = backendOrigin();

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  async rewrites() {
    if (!remoteBackend) return [];

    return {
      beforeFiles: [
        {
          source: "/api/:path*",
          destination: `${remoteBackend}/api/:path*`,
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
