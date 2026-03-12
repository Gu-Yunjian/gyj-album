# Gu Album - 摄影相册

基于 Next.js + Cloudflare Pages 的静态摄影相册。

## ✨ 特性

- 🖼️ **自动图片压缩**：原图自动压缩为 WebP，主图 ≤1MB，缩略图 ≤200KB
- 📷 **EXIF 信息展示**：自动提取光圈、快门、ISO、相机型号等
- 🚀 **Cloudflare Pages 部署**：全球 CDN 加速，国内访问友好
- 🎨 **现代化界面**：响应式设计，支持灯箱浏览

## 🚀 快速开始

### 环境准备

```bash
# 安装 Node.js 依赖
npm install

# 安装 Python 依赖（图片处理用）
pip install -r scripts/requirements.txt
```

### 添加照片

```bash
# 1. 将原图放入 originals/ 目录
copy your-photos/*.jpg originals/

# 2. 运行处理脚本（压缩 + 提取 EXIF）
python scripts/process_photos.py

# 3. 本地预览
npm run dev
```

### 部署

```bash
# 一键部署（Windows）
scripts\deploy.bat

# 或手动
git add .
git commit -m "update photos"
git push origin main
```

## 📁 项目结构

```
gu-album/
├── originals/              # 原图（不提交到 git）
├── public/
│   ├── photos/            # 压缩后的主图
│   ├── thumbnails/        # 缩略图
│   └── photos.json        # 照片元数据
├── scripts/
│   ├── process_photos.py  # 图片处理脚本
│   ├── deploy.bat         # 一键部署脚本（Windows）
│   └── deploy.ps1         # 一键部署脚本（PowerShell）
├── src/
│   └── app/
│       ├── admin/         # 管理后台
│       └── ...
└── DEPLOY.md              # 详细部署文档
```

## 🛠️ 技术栈

- **框架**：Next.js 15 + React 19
- **样式**：CSS Modules
- **部署**：Cloudflare Pages（静态导出）
- **图片处理**：Python + Pillow + piexif

## 📝 详细文档

- [部署说明](./DEPLOY.md) - 完整的工作流指南

## ⚠️ 注意事项

1. **原图不放 git**：原图放在 `originals/` 目录，已添加到 `.gitignore`
2. **Cloudflare Pages 限制**：单个文件 ≤25MB，总文件数 ≤20,000
3. **国内访问**：无需备案，使用 Cloudflare 全球节点

---

Made with ❤️ by Gu
