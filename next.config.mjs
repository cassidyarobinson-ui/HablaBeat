/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

if (process.env.CAPACITOR_BUILD === 'true') {
  nextConfig.output = 'export'
}

export default nextConfig
