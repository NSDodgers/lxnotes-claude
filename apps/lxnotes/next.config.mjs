import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Monorepo root for output file tracing
  outputFileTracingRoot: path.join(__dirname, '../..'),

  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Turbopack configuration for monorepo
  turbopack: {
    root: path.join(__dirname, '../..'),
  },
};

export default nextConfig;