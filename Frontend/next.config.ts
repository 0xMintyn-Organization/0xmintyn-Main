import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'appbackend.0xmintyn.com',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '209.74.89.249',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'static.vecteezy.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'github.com',
      },
    ],
    // Keep domains for backward compatibility (Next.js 12 style)
    domains: [
      'localhost', 
      'appbackend.0xmintyn.com',
      'yourdomain.com', 
      'static.vecteezy.com', 
      'picsum.photos',
      'images.unsplash.com',
      'via.placeholder.com',
      'github.com',
      '209.74.89.249'
    ],
  },
   eslint: {
    // ⚠️  This lets the build succeed even if there are ESLint errors.
    //     Use with care—lint problems will simply be printed to the console.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ⚠️  Builds will succeed even if there are TypeScript errors
    ignoreBuildErrors: true,
  },
  // Performance optimizations
  // Note: swcMinify is enabled by default in Next.js 15, no need to specify
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Optimize bundle size
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-avatar',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      'lucide-react',
      'recharts',
    ],
  },
};

export default nextConfig;
