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

module.exports = nextConfig

