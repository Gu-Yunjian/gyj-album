# GU-Album 技术文档

> 版本: 1.1  
> 最后更新: 2026-03-13  
> 技术栈: Next.js 15 + React 19 + TypeScript + Embla Carousel

---

## 一、技术栈概览

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 框架 | Next.js | 15.5.12 | App Router, SSG |
| UI 库 | React | 19.x | 组件化开发 |
| 语言 | TypeScript | 5.x | 类型安全 |
| 轮播 | embla-carousel-react | latest | 硬件加速轮播 |
| 样式 | CSS Modules | - | 组件级样式隔离 |
| 图标 | @phosphor-icons/react | ^2.x | SVG 图标库 |
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
│   │   ├── collections/       # 影集列表页
│   │   ├── album/[name]/      # 影集内容页（动态路由）
│   │   └── admin/             # 管理页
│   ├── components/            # React 组件
│   │   ├── album/
│   │   │   └── AlbumView.tsx      # 影集内容页主组件（Embla）
│   │   ├── gallery/
│   │   │   └── OverviewGrid.tsx   # 首页画廊
│   │   └── layout/
│   │       └── Navigation.tsx     # 顶部导航栏
│   └── lib/                   # 工具库
│       └── photos.ts          # 照片数据读取
├── public/                    # 静态资源
│   ├── photos/                # 影集照片目录
│   ├── thumbnails/            # 缩略图目录
│   └── albums.json            # 影集元数据
└── package.json
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
```

**数据源**:
1. 影集照片: `/public/photos/[album-name]/`
2. 缩略图: `/public/thumbnails/[album-name]/`
3. 元数据: `/public/albums.json`

### 3.2 EXIF 提取 (Python)

**提取字段**:
```typescript
interface ExifInfo {
  aperture?: string;      // 光圈, 如 "f/8"
  shutterSpeed?: string;  // 快门速度, 如 "1/60s"
  iso?: number;           // ISO 值
}
```

**处理流程**:
```
originals/照片.jpg
    ↓
process_photos.py
    ↓
public/photos/照片.webp (≤1MB)
public/thumbnails/照片.webp (54px)
public/albums.json (EXIF + 元数据)
```

### 3.3 Embla Carousel 轮播

**配置**:
```typescript
const [emblaRef, emblaApi] = useEmblaCarousel({
  loop: false,            // 不循环，有边界
  align: 'center',
  containScroll: false,
  dragFree: false,        // 对齐到单张
});
```

**切换策略**:
- 相邻切换（滑动/按钮）：平滑滑动动画
- 远距离跳转（缩略图）：硬切，无动画

---

## 四、组件规范

### 4.1 AlbumView 组件架构

```tsx
<AlbumView>
  ├── .main                          # 主区域
  │   ├── .mobileHeader              # 移动端顶部信息栏（面板展开时显示）
  │   ├── .carousel (Embla)          # 轮播
  │   ├── .controls                  # 桌面端控制按钮
  │   └── .mobileControls            # 移动端控制按钮（默认隐藏）
  └── .sidebar
      ├── .desktopLayout             # 桌面端布局
      └── .mobilePanel               # 移动端面板（可折叠）
```

### 4.2 移动端交互状态

| 状态 | 触发条件 | 效果 |
|------|----------|------|
| 控制按钮显示 | 点击照片 | 按钮栏展开，照片区域压缩（0.8s 惯性动画） |
| 控制按钮隐藏 | 再次点击照片 | 按钮栏收起，照片区域撑满 |
| 面板展开 | 点击▲或上滑 | 下面板升起，顶部信息栏渐显 |
| 面板收起 | 点击▼或下滑 | 下面板降下，顶部信息栏渐隐 |

### 4.3 CSS Modules 规范

**类名规范**:
- 使用 camelCase
- 语义化命名
- BEM 在 CSS Modules 中不必要

```css
/* 推荐 */
.container { }
.carouselSlide { }
.mobileHeader { }
.thumbnailActive { }
```

---

## 五、响应式设计

### 5.1 断点定义

```css
@media (max-width: 768px) { /* 移动端 */ }
@media (max-width: 1024px) { /* 平板 */ }
```

### 5.2 布局适配

| 页面 | PC | 平板 | 移动端 |
|------|-----|------|--------|
| 首页 | 多列瀑布流 | 2-3 列 | 2 列 |
| 影集列表 | 网格 | 网格 | 单列 |
| 影集内容 | 双栏（照片+侧边栏） | 单栏（面板折叠） | 单栏（面板折叠） |

### 5.3 移动端特殊处理

- **导航箭头**：隐藏，使用左右滑动手势
- **控制按钮**：默认隐藏，点击照片显示
- **九宫格**：改为单行横向滚动
- **信息面板**：可折叠，默认收起
- **照片切换**：触摸滑动，边界回弹

---

## 六、动画系统

### 6.1 过渡时长

```css
--transition-fast: 150ms ease-out;    /* 微交互 */
--transition-base: 200ms ease-out;    /* 常规 */
--transition-slow: 300ms ease-in-out; /* 面板展开 */
--transition-inertia: 800ms cubic-bezier(0.25, 0.46, 0.45, 0.94); /* 照片区域 */
```

### 6.2 动画类型

| 场景 | 动画 | 时长 | 缓动 |
|------|------|------|------|
| 控制按钮显示 | opacity + translateY | 300ms | ease |
| 照片区域调整 | height | 800ms | cubic-bezier（惯性） |
| 面板展开 | transform: translateY | 300ms | ease-out |
| 顶部信息栏 | opacity | 250ms | ease |
| 九宫格滚动 | transform: translateY | 300ms | ease-out |
| 轮播滑动 | transform: translateX | 350ms | ease-out |

### 6.3 性能优化

- 使用 `transform` 和 `opacity` 实现动画（GPU 加速）
- 避免动画 `width`, `height`（除照片区域外）
- 适当使用 `will-change`
- Embla Carousel 使用 `requestAnimationFrame`

---

## 七、开发规范

### 7.1 代码提交规范

```
<type>(<scope>): <subject>

<body>
```

**Type**:
- `feat`: 新功能
- `fix`: 修复 bug
- `refactor`: 重构
- `style`: 样式调整
- `docs`: 文档更新

### 7.2 TypeScript 规范

- 启用 strict 模式
- 避免 `any`，使用具体类型
- Props 接口命名为 `ComponentNameProps`

### 7.3 性能优化

- 图片使用原生 `img`（静态导出）
- 使用 `useCallback` 缓存事件处理器
- 动画使用 `transform` 和 `opacity`

---

## 八、常见问题

### Q: 照片轮播卡顿？
A: 使用 embla-carousel，确保硬件加速开启。开发模式可能有卡顿，生产环境正常。

### Q: 移动端按钮无法显示？
A: 检查 `showMobileControls` 状态，点击照片区域触发。

### Q: 面板展开/收起异常？
A: 检查 CSS 的 `transform` 和 `transition` 是否正确应用。

### Q: 九宫格无法滚动？
A: 确保 `onWheel` 事件已绑定，且 `scrollY` 状态正确更新。
