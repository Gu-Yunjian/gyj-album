import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 静态导出模式（仅用于生产构建/部署到静态托管）
  // 开发模式下保留 API routes 功能
  output: process.env.NODE_ENV === 'development' ? undefined : 'export',
  distDir: 'dist',
  
  // 图片配置（静态导出时需要禁用图片优化）
  images: {
    unoptimized: true,
  },
  
  // 尾部斜杠（提高兼容性）
  trailingSlash: true,
  
  // 实验性功能
  experimental: {
    // 静态导出不需要这个配置
    // serverComponentsExternalPackages: ['@phosphor-icons/react', 'exifr'],
  },
};

export default nextConfig;
