/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['antd', '@ant-design/icons'],
  },
  webpack: (config) => {
    // 保持 Next.js 默认的代码分割配置，避免开发环境资源 404
    return config;
  },
  // 启用SWC进行更快的编译
  swcMinify: true,
}

module.exports = nextConfig 