// Merged duplicate calculators: old href → the page that replaced it. tests/redirects.test.ts checks it.
import calculatorRedirects from './src/registry/redirects.json' with { type: 'json' };

// The site moved from the Vercel subdomain to its own domain (src/lib/site.ts). Exact host, so previews still serve.
export const OLD_HOST = 'photonics-calculators.vercel.app';
const NEW_ORIGIN = 'https://photonicscalculators.com';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: OLD_HOST }],
        destination: `${NEW_ORIGIN}/:path*`,
        permanent: true,
      },
      ...Object.entries(calculatorRedirects).map(([source, destination]) => ({
        source,
        destination,
        permanent: true,
      })),
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
}

export default nextConfig;
