import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Enable standalone output for Docker
  output: 'standalone',
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
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
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
      '209.74.89.249',
      'res.cloudinary.com'
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
};

export default nextConfig;
