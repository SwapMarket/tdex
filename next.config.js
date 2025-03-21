/** @type {import('next').NextConfig} */
const nextConfig = {
  publicRuntimeConfig: {
    staticFolder: "", // public folder base
  },
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      buffer: require.resolve('buffer/'),
      fs: false,
    }
    config.experiments.asyncWebAssembly = true
    return config
  },
}

module.exports = nextConfig
