import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 静态导出模式（用于 Cloudflare Pages 部署）
  output: 'export',
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
