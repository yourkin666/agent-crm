/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['sqlite3'],
    optimizePackageImports: ['antd', '@ant-design/icons'],
  },
  webpack: (config, { dev, isServer }) => {
    config.externals.push({
      'sqlite3': 'commonjs sqlite3'
    });
    
    // 优化开发模式下的编译速度
    if (dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
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
            },
          },
        },
      };
    }
    
    return config;
  },
  // 启用SWC进行更快的编译
  swcMinify: true,
}

module.exports = nextConfig 