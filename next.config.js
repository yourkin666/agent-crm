/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['antd', '@ant-design/icons'],
  },
  webpack: (config) => {
    // 优化代码分割
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        antd: {
          test: /[\\/]node_modules[\\/]antd[\\/]/,
          name: 'antd',
          chunks: 'all',
          priority: 10,
        },
      },
    };
    return config;
  },
  // 启用SWC进行更快的编译
  swcMinify: true,
  // 启用压缩
  compress: true,
  // 优化图片
  images: {
    formats: ['image/webp', 'image/avif'],
  },
}

module.exports = nextConfig 