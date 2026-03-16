/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    // WalletConnect uses pino-pretty optionally; ignore it in browser bundles
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "pino-pretty": false,
      "@react-native-async-storage/async-storage": false,
      encoding: false,
      fs: false,
      net: false,
      tls: false,
    }
    return config
  },
}

export default nextConfig
