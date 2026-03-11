# GU-Album 技术文档

> 版本: 1.0  
> 最后更新: 2026-03-11  
> 技术栈: Next.js 16 + React 19 + TypeScript

---

## 一、技术栈概览

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 框架 | Next.js | 16.1.6 | App Router, SSR/SSG |
| UI 库 | React | 19.2.3 | 组件化开发 |
| 语言 | TypeScript | 5.x | 类型安全 |
| 样式 | CSS Modules | - | 组件级样式隔离 |
| 图标 | @phosphor-icons/react | ^2.1.10 | SVG 图标库 |
| EXIF 解析 | exifr | latest | 图片元数据提取 |
| 字体 | Inter + Noto Sans SC | Google Fonts | 中西文字体 |

---

## 二、项目结构

```
gu-album/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx         # 根布局（字体、元数据）
│   │   ├── page.tsx           # 首页（画廊）
│   │   ├── globals.css        # 全局样式 + CSS 变量
│   │   ├── HomeClient.tsx     # 首页客户端组件
│   │   ├── collections/       # 影集列表页
│   │   ├── album/[name]/      # 影集内容页（动态路由）
│   │   ├── about/             # 关于页
│   │   ├── admin/             # 管理页
│   │   └── api/               # API 路由
│   │       ├── albums/        # 影集 API
│   │       ├── home-photos/   # 首页照片 API
│   │       └── photos/        # 照片 EXIF API
│   ├── components/            # React 组件
│   │   ├── ui/                # 基础 UI 组件
│   │   │   └── Lightbox.tsx   # 灯箱组件
│   │   ├── gallery/           # 画廊相关
│   │   │   ├── GalleryCanvas.tsx
│   │   │   ├── IndexView.tsx
│   │   │   ├── PhotoCard.tsx
│   │   │   └── CenterProfile.tsx
│   │   ├── album/             # 影集相关
│   │   │   ├── AlbumView.tsx      # 影集内容页主组件
│   │   │   └── CollectionCard.tsx # 影集卡片
│   │   └── layout/            # 布局组件
│   │       └── Navigation.tsx     # 顶部导航栏
│   └── lib/                   # 工具库
│       ├── photos.ts          # 照片数据读取
│       ├── exif.ts            # EXIF 提取工具
│       └── theme.ts           # 主题管理
├── public/                    # 静态资源
│   ├── photos/                # 影集照片目录
│   │   └── [album-name]/
│   │       ├── info.txt       # 影集元数据 (JSON)
│   │       ├── cover.jpg      # 封面 (可选)
│   │       └── *.jpg          # 照片
│   └── home-photos/           # 首页精选照片
├── package.json
└── tsconfig.json
```

---

## 三、核心模块详解

### 3.1 照片数据流 (`lib/photos.ts`)

**核心接口**:
```typescript
interface AlbumInfo {
  name: string;           // 目录名
  title: string;          // 显示标题
  subtitle: string;       // 副标题
  cover: string;          // 封面文件名
  photos: string[];       // 照片文件名列表
  photoInfos: Record<string, PhotoInfo>;  // 照片元数据
  hasBgm: boolean;        // 是否有背景音乐
}

interface PhotoInfo {
  title: string;          // 照片标题
  desc: string;           // 照片描述
  exif?: ExifInfo;        // EXIF 信息
}

interface GalleryPhoto {
  src: string;            // 照片路径
  album: string;          // 所属影集
  albumTitle: string;     // 影集标题
  index: string;          // 照片索引
  info?: PhotoInfo;       // 照片信息
  source?: 'album' | 'home-folder';  // 来源
}
```

**数据缓存**:
- 服务端缓存，TTL: 5 秒
- 缓存对象: albumsCache, photosCache, homePhotosCache

**数据源**:
1. 影集照片: `/public/photos/[album-name]/`
2. 首页照片: `/public/home-photos/`

### 3.2 EXIF 提取 (`lib/exif.ts`)

**依赖**: `exifr` (比 exif-reader 更可靠)

**提取字段**:
```typescript
interface ExifInfo {
  aperture?: string;      // 光圈, 如 "f/8"
  shutterSpeed?: string;  // 快门速度, 如 "1/60s"
  iso?: number;           // ISO 值
}
```

**格式化规则**:
- 光圈: `f/${FNumber}`
- 快门: >=1秒显示 `"${value}"`，<1秒显示 `1/${Math.round(1/value)}s`
- ISO: 原始数字

**API 路由**:
```
GET /api/photos/[album]/[filename]
Response: { aperture?: string, shutterSpeed?: string, iso?: number }
```

### 3.3 影集元数据格式 (`info.txt`)

**文件位置**: `/public/photos/[album-name]/info.txt`

**JSON 格式**:
```json
{
  "title": "影集标题",
  "subtitle": "副标题/描述",
  "photos": {
    "filename-without-ext": {
      "title": "照片标题",
      "desc": "照片描述"
    }
  }
}
```

**示例**:
```json
{
  "title": "北京胡同",
  "subtitle": "2024年秋日随拍",
  "photos": {
    "DSC001": { "title": "晨雾", "desc": "清晨的胡同" },
    "DSC002": { "title": "老街", "desc": "斑驳的墙面" }
  }
}
```

---

## 四、组件规范

### 4.1 组件分类

| 类型 | 目录 | 命名规范 | 示例 |
|------|------|----------|------|
| 页面组件 | `app/**/page.tsx` | `page.tsx` | `app/about/page.tsx` |
| 布局组件 | `components/layout/` | PascalCase | `Navigation.tsx` |
| 功能组件 | `components/gallery/` | PascalCase | `GalleryCanvas.tsx` |
| 影集组件 | `components/album/` | PascalCase | `AlbumView.tsx` |
| UI 组件 | `components/ui/` | PascalCase | `Lightbox.tsx` |

### 4.2 组件文件结构

```tsx
// 1. 导入
import { useState, useCallback } from 'react';
import styles from './Component.module.css';

// 2. 类型定义
interface ComponentProps {
  title: string;
  onAction?: () => void;
}

// 3. 组件实现
export default function Component({ title, onAction }: ComponentProps) {
  // State
  const [active, setActive] = useState(false);
  
  // 处理器
  const handleClick = useCallback(() => {
    setActive(!active);
    onAction?.();
  }, [active, onAction]);
  
  // 渲染
  return (
    <div className={styles.container}>
      <button onClick={handleClick}>{title}</button>
    </div>
  );
}
```

### 4.3 CSS Modules 规范

**文件命名**: `Component.module.css`

**类名规范**:
- 使用 camelCase
- 语义化命名
- 避免嵌套过深

```css
/* 推荐 */
.container { }
.imageWrapper { }
.navButton { }
.navButtonActive { }

/* 避免 */
.block__element--modifier { }  /* BEM 在 CSS Modules 中不必要 */
.xxx { }  /* 无意义命名 */
```

---

## 五、API 路由

### 5.1 影集 API

```
GET /api/albums
Response: AlbumInfo[]

GET /api/albums/[name]
Response: AlbumInfo
```

### 5.2 首页照片 API

```
GET /api/home-photos
Response: GalleryPhoto[]
```

### 5.3 照片 EXIF API

```
GET /api/photos/[album]/[filename]
Response: ExifInfo | {}
```

**路径解析**:
- `album === 'home-photos'`: 查找 `/public/home-photos/`
- 其他: 查找 `/public/photos/[album]/`

---

## 六、页面说明

### 6.1 首页 (`/`)

**功能**:
- 瀑布流展示所有照片（影集 + home-photos）
- 灯箱浏览
- 个人简介居中

**组件**:
- `GalleryCanvas` - 可拖动瀑布流
- `CenterProfile` - 个人简介
- `Lightbox` - 灯箱

### 6.2 影集列表 (`/collections`)

**功能**:
- 网格展示所有影集
- 点击跳转影集内容页

**组件**:
- `CollectionCard` - 影集卡片

### 6.3 影集内容 (`/album/[name]`)

**功能**:
- 双栏布局（照片 + 信息）
- 照片切换（箭头/缩略图）
- 夜间模式切换
- EXIF 展示
- BGM 播放（如有）

**组件**:
- `AlbumView` - 主组件
- 内置功能，无灯箱

### 6.4 关于页 (`/about`)

**功能**:
- Markdown 渲染个人介绍

---

## 七、样式系统

### 7.1 CSS 变量

所有变量定义在 `globals.css` 的 `:root` 中：

```css
/* 颜色 */
--bg-primary: #FFFFFF;
--text-primary: #000000;
--text-secondary: rgba(0, 0, 0, 0.5);

/* 间距 */
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;

/* 字号 */
--font-size-base: 14px;
--font-size-lg: 18px;

/* 过渡 */
--transition-base: 200ms ease-out;

/* 圆角 */
--radius-sm: 2px;
```

### 7.2 响应式断点

```css
@media (max-width: 768px) { /* 移动端 */ }
@media (max-width: 1024px) { /* 平板 */ }
```

---

## 八、开发规范

### 8.1 代码提交规范

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type**:
- `feat`: 新功能
- `fix`: 修复 bug
- `refactor`: 重构
- `style`: 样式调整
- `docs`: 文档更新

**示例**:
```
feat(gallery): 添加首页灯箱 EXIF 展示

- 使用 exifr 解析照片 EXIF
- 展示光圈、快门速度、ISO

Closes #1
```

### 8.2 TypeScript 规范

- 启用 strict 模式
- 避免 `any`，使用 `unknown` 或具体类型
- 接口名使用 PascalCase
- Props 接口命名为 `ComponentNameProps`

### 8.3 性能优化

- 图片使用 Next.js `Image` 组件（懒加载）
- 服务端缓存照片数据（5秒 TTL）
- 使用 `useCallback` 缓存事件处理器
- 动画使用 `transform` 和 `opacity`

---

## 九、新增功能开发指南

### 9.1 添加新页面

1. 创建 `app/[page]/page.tsx`
2. 创建 `app/[page]/page.module.css`
3. 添加到导航（如需要）

### 9.2 添加新组件

1. 在合适目录创建 `ComponentName.tsx`
2. 创建 `ComponentName.module.css`
3. 定义 Props 接口
4. 使用 CSS Modules 类名

### 9.3 修改样式

1. 优先使用 CSS 变量
2. 组件样式在 `.module.css` 中
3. 全局样式仅在 `globals.css`

### 9.4 添加 API

1. 创建 `app/api/[route]/route.ts`
2. 使用 Next.js Route Handler 格式
3. 返回 JSON 响应

---

## 十、常见问题

### Q: EXIF 解析失败？
A: 确保使用 `exifr` 库，它比 `exif-reader` 更可靠。

### Q: 照片不显示？
A: 检查照片是否在 `public/photos/` 或 `public/home-photos/` 目录中。

### Q: 样式不生效？
A: CSS Modules 需要使用 `styles.className` 形式引用。

### Q: 缓存导致数据不更新？
A: 服务端缓存 TTL 为 5 秒，或重启开发服务器。
