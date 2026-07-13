const PUBLIC_HTML_CACHE_CONTROL = 'public, s-maxage=600, stale-while-revalidate=60'
const PUBLIC_ASSET_CACHE_CONTROL = 'public, max-age=604800, s-maxage=2592000, stale-while-revalidate=86400'
const REDIRECT_CACHE_CONTROL = 'no-store'
const PRIVATE_CACHE_CONTROL = 'private, no-store'

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    if (process.env.NODE_ENV !== 'production') {
      return []
    }

    return [
      {
        source: '/:locale(zh|en)',
        headers: [
          {
            key: 'Cache-Control',
            value: PUBLIC_HTML_CACHE_CONTROL,
          },
        ],
      },
      {
        source: '/:locale(zh|en)/(blog|mcp|privacy-policy|cookie-policy|terms-of-use)/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: PUBLIC_HTML_CACHE_CONTROL,
          },
        ],
      },
      {
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: REDIRECT_CACHE_CONTROL,
          },
        ],
      },
      {
        source: '/(blog|mcp|privacy-policy|cookie-policy|terms-of-use)/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: REDIRECT_CACHE_CONTROL,
          },
        ],
      },
      {
        source: '/(auth|oauth|agent-oauth|articles|payment)/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: PRIVATE_CACHE_CONTROL,
          },
        ],
      },
      {
        source: '/:path*\\.(png|jpg|jpeg|svg|webp|css|js|woff|woff2|mp4|webm)',
        headers: [
          {
            key: 'Cache-Control',
            value: PUBLIC_ASSET_CACHE_CONTROL,
          },
        ],
      },
      {
        source: '/(sitemap.xml|robots.txt)',
        headers: [
          {
            key: 'Cache-Control',
            value: PUBLIC_HTML_CACHE_CONTROL,
          },
        ],
      },
    ]
  },
  // Enable standalone output for Docker deployment
  output: 'standalone',
}

export default nextConfig
