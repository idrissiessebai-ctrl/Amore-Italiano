import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  skipTrailingSlashRedirect: true,
  images: {
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "qfoxuoplporoknduwawr.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      { protocol: "https", hostname: "upload.wikimedia.org" },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://eu-assets.posthog.com/static/:path*",
      },
      {
        source: "/ingest/array/:path*",
        destination: "https://eu-assets.posthog.com/array/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://eu.posthog.com/:path*",
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "object-src 'none'",
              "frame-ancestors 'none'",
              "form-action 'self'",
              "script-src 'self' 'unsafe-inline' https://clerk.amoreitalianosafi.com https://*.clerk.accounts.dev https://*.clerk.com https://*.i.posthog.com blob:",
              "worker-src 'self' blob:",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' https://*.supabase.co https://*.tile.openstreetmap.org https://upload.wikimedia.org https://*.i.posthog.com https://img.clerk.com https://*.clerk.com data: blob:",
              "media-src 'self' https://*.supabase.co blob:",
              "connect-src 'self' https://*.i.posthog.com https://api.resend.com https://*.resend.com https://clerk.amoreitalianosafi.com https://*.clerk.accounts.dev https://*.clerk.com https://clerk-telemetry.com https://*.clerk-telemetry.com",
              "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com",
            ].join("; "),
          },
        ],
      },
    ];
  },
};
export default nextConfig;
