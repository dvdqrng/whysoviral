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
  // Prevent static generation errors for dynamic pages
  unstable_excludeFiles: [
    '**/app/auth/login/**',
    '**/app/teams/join/**',
    '**/app/api/auth/status/**',
    '**/app/api/test-db/**'
  ]
};

module.exports = nextConfig; 