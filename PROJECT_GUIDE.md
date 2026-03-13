# Gu Album 项目参考指南

> 本文档包含最终定稿的部署方案、技术架构和工作流
> 更新日期：2026-03-13

---

## 📁 项目架构

```
gu-album/
├── originals/              # 原图存放（gitignore）
│   ├── 影集名称/          # 子目录作为影集
│   └── ...
├── public/
│   ├── photos/            # 压缩后的主图（WebP ≤1MB）
│   │   └── 影集名称/
│   ├── thumbnails/        # 缩略图（54×54px）
│   │   └── 影集名称/
│   └── albums.json        # 影集元数据（自动生成）
├── scripts/
│   ├── process_photos.py  # 图片处理脚本
│   ├── deploy.bat         # Windows 一键部署
│   └── deploy.ps1         # PowerShell 一键部署
├── src/
│   ├── app/               # Next.js App Router
│   ├── components/
│   │   ├── album/AlbumView.tsx      # 影集展示组件
│   │   ├── gallery/OverviewGrid.tsx # 首页网格
│   │   └── ui/Lightbox.tsx          # 灯箱组件
│   └── lib/photos.ts      # 数据读取逻辑
└── next.config.ts         # 静态导出配置
```

---

## 🚀 部署方案

### 平台选择
- **Cloudflare Pages**（推荐）
  - 免费额度充足
  - 全球 CDN 加速
  - 无需备案
  - GitHub 自动部署

### 构建设置
```yaml
Framework preset: Next.js
Build command: npm run build
Build output directory: dist
```

### 静态导出配置
```typescript
// next.config.ts
const nextConfig = {
  output: 'export',
  distDir: 'dist',
  images: { unoptimized: true },
}
```

---

## 🖼️ 图片处理工作流

### 1. 添加原图
```bash
# 将照片放入对应影集目录
cp 照片.jpg originals/影集名/
```

### 2. 运行处理脚本
```bash
python scripts/process_photos.py
```
**功能**：
- 压缩主图：WebP 格式，≤1MB
- 生成缩略图：54×54px（桌面），44×44px（手机）
- 提取 EXIF：光圈、快门、ISO、相机型号
- 生成 `albums.json` 元数据

### 3. 编辑影集信息
访问 `/admin`（密码：`gu123456`）
- 编辑影集标题、副标题
- 编辑照片标题、描述
- 下载 `albums.json` 并放入 `public/` 目录

### 4. 部署
```bash
# 一键部署
scripts\deploy.bat

# 或手动
git add .
git commit -m "update photos"
git push origin main
```

---

## 🎨 关键功能规格

### 影集页（AlbumView）

| 功能 | 规格 |
|------|------|
| **照片展示** | Embla Carousel 轮播，自适应居中，无滚动 |
| **控制按钮** | 桌面：hover 照片区域显示；移动端：默认隐藏，点击照片显示 |
| **九宫格缩略图** | 3×3 布局，54px/格，鼠标滚轮滑动，平滑过渡 |
| **EXIF 显示** | 光圈 · 快门 · ISO，使用默认字体 |
| **响应式** | 桌面：左右布局；平板/手机：上下布局 |

### 移动端自适应布局

| 元素 | 默认状态 | 交互 |
|------|----------|------|
| **顶部信息栏** | 隐藏 | 面板展开时显示（渐隐动画） |
| **控制按钮** | 隐藏 | 点击照片显示，再点击隐藏 |
| **下面板** | 收起 | 点击展开按钮或上滑展开 |
| **照片切换** | 左右滑动 | 边界自动回弹 |

### 首页（OverviewGrid）
- 从所有影集聚合照片
- 每日随机排序（基于日期种子）
- 灯箱展示，支持 EXIF 信息显示

---

## 📊 数据结构

### albums.json
```json
{
  "albums": [
    {
      "name": "影集标识",
      "title": "显示标题",
      "subtitle": "副标题",
      "cover": "封面文件名",
      "photos": ["photo1.webp", "photo2.webp"],
      "photoInfos": {
        "photo1": { "title": "", "desc": "", "exif": {} }
      },
      "hasBgm": false
    }
  ],
  "allPhotos": {
    "影集名/photo1": {
      "filename": "photo1.webp",
      "mainSize": 890000,
      "thumbSize": 3500,
      "exif": {
        "aperture": "f/2.8",
        "shutterSpeed": "1/125s",
        "iso": 100
      }
    }
  }
}
```

---

## ⚙️ 技术栈

- **框架**：Next.js 15 + React 19
- **语言**：TypeScript
- **样式**：CSS Modules
- **轮播**：embla-carousel（3KB，硬件加速）
- **图片处理**：Python + Pillow + piexif
- **部署**：Cloudflare Pages（静态导出）

---

## 📝 关键文件说明

| 文件 | 作用 |
|------|------|
| `scripts/process_photos.py` | 图片压缩、EXIF提取、生成 albums.json |
| `src/lib/photos.ts` | 数据读取接口（getAlbums, getAllPhotos 等）|
| `src/components/album/AlbumView.tsx` | 影集展示页核心组件（Embla Carousel）|
| `src/app/admin/page.tsx` | 管理后台（影集/照片编辑）|
| `.gitignore` | 忽略 originals/、node_modules/ 等 |

---

## 🔧 常见问题

### 开发模式卡顿
- 正常现象（React 严格模式、Source Map）
- 部署后会有 20-40% 性能提升

### 图片压缩后仍大于 1MB
- 脚本会自动降低质量重试
- 极端情况需手动压缩原图后再处理

### EXIF 提取失败
- 部分手机拍摄的照片可能缺少 EXIF
- 不影响整体功能

---

## 🌐 访问地址

- **本地开发**：http://localhost:3000
- **Admin**：http://localhost:3000/admin（密码：gu123456）
- **生产环境**：Cloudflare Pages 自动分配的域名

---

## 📌 决策记录（按时间最新优先）

1. **移动端控制按钮**：默认隐藏，点击照片显示/隐藏
2. **顶部信息栏**：与面板联动，面板展开时显示
3. **照片区域动画**：0.8s 惯性动画，按钮显示时自适应
4. **九宫格滑动**：鼠标滚轮 + 平滑过渡动画
5. **轮播方案**：embla-carousel（轻量、流畅）
6. **缩略图选中状态**：边框高亮，无发光效果（避免卡顿）
7. **EXIF 字体**：使用项目默认字体，不强制 monospace
8. **影集页布局**：整屏无滚动，照片自适应填充
9. **图片压缩**：WebP 格式，主图 ≤1MB，缩略图 54×54px
