import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.terangatable.cloud' }],
        destination: 'https://terangatable.cloud/:path*',
        permanent: true,
      },
    ];
  },
  // Required so the standalone bundle includes workspace package files
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: ['@terangatable/shared', '@terangatable/ui'],
  images: {
    remotePatterns: [
      { protocol: 'http',  hostname: 'localhost' },
      { protocol: 'https', hostname: '*.terangatable.com' },
      { protocol: 'https', hostname: '*.terangatable.cloud' },
      { protocol: 'https', hostname: '*.amazonaws.com' },
      { protocol: 'https', hostname: '*.cloudinary.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
};

export default nextConfig;
