import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      'localhost', 
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
};

export default nextConfig;
