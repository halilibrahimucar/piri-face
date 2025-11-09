/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Fix for face-api.js and tensorflow.js - ignore Node.js modules in client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        encoding: false,
        path: false,
        crypto: false,
      };
    }
    
    // Ignore node-fetch in client bundle
    config.resolve.alias = {
      ...config.resolve.alias,
      'node-fetch': false,
    };

    // MP3 file support
    config.module.rules.push({
      test: /\.(mp3)$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/media/[name][ext]'
      }
    });
    
    return config;
  }
}

export default nextConfig;