/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    // Existing codebase has historical lint debt; keep builds unblocked while we fix issues incrementally.
    ignoreDuringBuilds: true,
  },
  
  // Enable standalone output only for production builds
  ...(process.env.NODE_ENV === 'production' && { output: 'standalone' }),
  
  // Environment variables that should be available on the client
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004',
  },
};

module.exports = nextConfig;
