import type { NextConfig } from 'next'
import withSerwistInit from '@serwist/next'

const nextConfig: NextConfig = {
  turbopack: {},
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ]
  },
}

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  additionalPrecacheEntries: ['/', '/event', '/tags', '/data', '/~offline'].map(
    (url) => ({
      url,
      revision: crypto.randomUUID(),
    }),
  ),
  disable: process.env.NODE_ENV === 'development',
})

export default withSerwist(nextConfig)
