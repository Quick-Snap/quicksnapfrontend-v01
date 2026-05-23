/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      /** Browsers request `/favicon.ico` by default; ours is PNG bytes served as `/favicon.png`. */
      { source: '/favicon.ico', destination: '/favicon.png' },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
}

const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(
  nextConfig,
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    // Suppresses source map uploading logs during profiling/building
    silent: true,
    org: "quicksnap",
    project: "quicksnap-frontend",
  },
  {
    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Uploads a larger set of source maps for clearer stack traces
    widenClientBounds: true,

    // Transpiles SDK to be compatible with older browsers
    transpileClientSDK: true,

    // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad blockers
    tunnelRoute: "/monitoring",

    // Hides source maps from public clients
    hideSourceMaps: true,

    // Automatically tree-shakes Sentry logging in production builds
    disableLogger: true,
  }
);

