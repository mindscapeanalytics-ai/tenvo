/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  turbopack: {
    // Force root to current directory to prevent scanning entire user home folder
    root: '.',
  },
}

module.exports = nextConfig








