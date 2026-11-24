import type { NextConfig } from "next";

/**
 * Where the backend API lives. Browser-side `/api/*` requests are proxied here,
 * so the storefront keeps same-origin cookies while the API runs as its own
 * process (default port 4000 in development).
 */
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

// If Cloudflare R2 is configured, allow its public host for next/image too.
const r2Public = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? process.env.R2_PUBLIC_URL ?? "";
let r2Hostname = "";
try {
  if (r2Public) r2Hostname = new URL(r2Public).hostname;
} catch {
  r2Hostname = r2Public.replace(/^https?:\/\//, "").split("/")[0];
}

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      ...(r2Hostname ? [{ hostname: r2Hostname }] : []),
      { hostname: "images.unsplash.com" },
      { hostname: "cdn11.bigcommerce.com" },
      { hostname: "upload.wikimedia.org" },
      { hostname: "thumb.wikimedia.org" },
      { hostname: "commons.wikimedia.org" },
      { hostname: "placehold.co" },
      { hostname: "m.media-amazon.com" },
      { hostname: "encrypted-tbn0.gstatic.com" },
      { hostname: "cdn.shopify.com" },
      { hostname: "5.imimg.com" },
      { hostname: "cpimg.tistatic.com" },
      { hostname: "res.cloudinary.com" },
    ],
  },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` }];
  },
};

export default nextConfig;
