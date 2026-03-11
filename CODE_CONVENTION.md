# GU-Album 代码规范

## 一、项目结构

```
gu-album/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 首页/画廊
│   ├── globals.css        # 全局样式 + CSS变量
│   ├── collections/
│   │   └── page.tsx       # 聚合影集页
│   ├── album/
│   │   └── [name]/
│   │       └── page.tsx   # 单个影集页
│   └── about/
│       └── page.tsx       # 关于页
├── components/             # React 组件
│   ├── ui/                # 基础 UI 组件
│   ├── gallery/           # 画廊相关
│   ├── album/             # 影集相关
│   └── layout/            # 布局组件
├── lib/                    # 工具函数
│   ├── photos.ts          # 图片处理
│   ├── exif.ts            # EXIF 提取
│   └── theme.ts           # 主题管理
├── public/                 # 静态资源
│   ├── photos/            # 照片目录
│   └── content/           # Markdown 内容
├── styles/                # 样式文件
└── package.json
```

---

## 二、命名规范

### 1. 文件命名
- **组件文件**: PascalCase (如 `GalleryCanvas.tsx`)
- **工具文件**: camelCase (如 `photos.ts`)
- **样式文件**: 与组件同名 (如 `GalleryCanvas.module.css`)
- **页面文件**: `page.tsx` 或 `page.server.tsx`

### 2. 组件命名
- **组件名**: PascalCase
- **Props 接口**: `ComponentNameProps`
- **事件处理**: `handleXxx` / `onXxx`

### 3. CSS 类名
- **BEM 风格**: `block__element--modifier`
- **或**: 简洁语义化命名

---

## 三、组件规范

### 1. 组件结构
```tsx
// 1. imports
import { useState } from 'react';
import styles from './Component.module.css';

// 2. types
interface Props {
  title: string;
  onClick?: () => void;
}

// 3. component
export default function Component({ title, onClick }: Props) {
  // 4. hooks + state
  const [active, setActive] = useState(false);

  // 5. handlers
  const handleClick = () => {
    setActive(!active);
    onClick?.();
  };

  // 6. render
  return (
    <div className={styles.container}>
      <button onClick={handleClick}>{title}</button>
    </div>
  );
}
```

### 2. 组件分类
| 类型 | 位置 | 示例 |
|------|------|------|
| 页面 | app/ | page.tsx |
| 布局 | components/layout/ | Navigation.tsx |
| 功能 | components/gallery/ | GalleryCanvas.tsx |
| UI | components/ui/ | Button.tsx |

---

## 四、样式规范

### 1. CSS Modules
- 使用 `.module.css` 文件
- 通过 `styles.className` 引用

### 2. CSS 变量
- 定义在 `app/globals.css`
- 遵循设计规范的颜色、间距
- 支持亮/暗色模式

### 3. 响应式
- 使用 CSS 变量 + media query
- 避免硬编码断点

---

## 五、数据规范

### 1. 照片目录结构
```
/public/photos/[AlbumName]/
├── cover.jpg        # 封面 (可选)
├── 01.jpg           # 照片
├── 02.jpg
├── info.txt         # 元数据
└── bgm.mp3         # 背景音乐 (可选)
```

### 2. info.txt 格式 (JSON)
```json
{
  "title": "影集标题",
  "subtitle": "副标题",
  "photos": {
    "01": { "title": "照片标题", "desc": "描述" }
  }
}
```

---

## 六、Git 提交规范

### 提交信息格式
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型
- `feat`: 新功能
- `fix`: 修复
- `refactor`: 重构
- `style`: 样式
- `docs`: 文档

### 示例
```
feat(gallery): 添加无限拖动功能

- 实现可拖动画布
- 添加惯性滑动效果

Closes #1
```

---

## 七、代码质量

### 1. TypeScript
- 启用 strict 模式
- 避免 `any`，使用 `unknown` 替代
- 优先使用类型推断

### 2. ESLint + Prettier
- 使用项目默认配置
- 提交前检查

### 3. 代码审查
- 功能完成后自检
- 检查命名、注释、边界情况
