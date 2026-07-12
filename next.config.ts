import type { NextConfig } from "next";

function backendOrigin(): string | null {
  const configured = process.env.BACKEND_API_URL?.trim();
  if (!configured) {
    if (process.env.VERCEL === "1") {
      throw new Error("BACKEND_API_URL is required for Vercel deployments");
    }
    return null;
  }

  const url = new URL(configured);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("BACKEND_API_URL must use http or https");
  }
  if (
    url.username !== "" ||
    url.password !== "" ||
    url.pathname !== "/" ||
    url.search !== "" ||
    url.hash !== ""
  ) {
    throw new Error("BACKEND_API_URL must be an origin without credentials, path, query or hash");
  }
  return url.origin;
}

const remoteBackend = backendOrigin();

const nextConfig: NextConfig = {
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
