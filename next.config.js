/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['p16-sign-va.tiktokcdn.com'],
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerCompiles: true,
    parallelServerBuildTraces: true,
  },
  // Set dynamic routes
  dynamicRoutes: [
    '/auth/login',
    '/teams/join',
    '/api/auth/status',
    '/api/test-db',
    '/api/tiktok/groups',
    '/api/tiktok/user'
  ]
};

module.exports = nextConfig; 