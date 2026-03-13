# GU-Album 代码库大白话讲解

> 本文用通俗的语言解释这个网站是怎么搭建的，适合非程序员阅读，也适合开发者快速理解整体架构。
> 更新日期：2026-03-13

---

## 一、先打个比方

想象你要开一家**摄影展览馆**：

- **Next.js** = 展览馆的骨架和基础设施
- **React** = 展览馆里的各种展示柜和互动装置
- **TypeScript** = 施工图纸上的标注，让工人知道每个零件该怎么装
- **CSS** = 展览馆的颜色、灯光、装修风格
- **照片文件** = 展品本身
- **albums.json** = 展品目录和说明牌

---

## 二、核心技术栈（用了哪些工具）

### 1. Next.js —— 网站的大框架

**这是什么？**

Next.js 是 React 的"增强版"，你可以理解为它是一个**网站的脚手架**，帮你把很多繁琐的事情都做了。

**它帮我们做了什么？**

| 功能 | 大白话解释 | 在本项目中的体现 |
|------|-----------|----------------|
| **路由** | 自动识别网址，显示对应页面 | 你访问 `/album/ceshi`，它就自动显示影集页面 |
| **SSG** | 网页先在服务器上组装好，再发给浏览器 | 打开影集页面时，照片列表已经准备好了 |
| **静态导出** | 生成纯 HTML 文件，可以直接部署 | 适合 Cloudflare Pages 部署 |

**简单说**：没有 Next.js，我们要自己写很多代码来处理网址跳转、页面渲染这些基础功能。

---

### 2. React —— 网页的乐高积木

**这是什么？**

React 是 Facebook 开发的 JavaScript 库，核心理念是**组件化**——把网页拆成一个个独立的"积木块"。

**举个例子**：

```
整个网站
├── 导航栏组件 (Navigation)
├── 照片轮播组件 (AlbumView)
├── 影集卡片组件 (CollectionCard)
├── 灯箱组件 (Lightbox)
└── ...
```

每个组件都是一个独立的小模块，有自己的样式、逻辑和功能。

**本项目中的组件**：

| 组件名 | 作用 | 在哪用 |
|--------|------|--------|
| `Navigation` | 顶部导航栏 | 每个页面都有 |
| `OverviewGrid` | 首页照片画廊 | 首页 |
| `Lightbox` | 点击放大看照片 | 首页 |
| `AlbumView` | 影集内容页主界面 | 影集页面 |
| `CollectionCard` | 影集封面卡片 | 影集列表页 |

---

### 3. TypeScript —— 给 JavaScript 加说明书

**这是什么？**

JavaScript 是浏览器的"母语"，但它很"自由"，容易出错。TypeScript 就是给 JavaScript 加上了**类型检查**。

**打个比方**：

- JavaScript：你去餐厅点菜，服务员不问你口味，直接上菜
- TypeScript：服务员会先问你"要不要辣""有没有忌口"，确保上的菜符合你的要求

**本项目中的例子**：

```typescript
// 定义"影集"应该长什么样
interface AlbumInfo {
  name: string;      // 名字必须是文字
  title: string;     // 标题必须是文字
  photos: string[];  // 照片必须是一个文字列表
  hasBgm: boolean;   // 是否有音乐，必须是"是"或"否"
}
```

这样做的好处是：如果你不小心把数字传给了 `name`，编辑器会立刻提醒你"喂，这里应该是文字！"

---

### 4. CSS Modules —— 组件的专属衣柜

**这是什么？**

传统的 CSS 是"全局"的，就像一个大衣柜，所有人的衣服都混在一起。CSS Modules 给每个组件配了一个**专属小衣柜**。

**为什么这样？**

防止"样式打架"。比如：
- 组件 A 定义了 `.title { color: red }`
- 组件 B 也定义了 `.title { color: blue }`
- 传统 CSS：后面的会覆盖前面的，混乱！
- CSS Modules：`.title` 自动变成 `.ComponentA_title` 和 `.ComponentB_title`，互不干扰

**本项目中的使用**：

```tsx
import styles from './Navigation.module.css';
// 使用时：styles.header 会被自动转换成唯一的类名
```

---

### 5. Embla Carousel —— 丝滑的轮播器

**这是什么？**

Embla 是一个**轻量级的轮播/滑动库**，比我们自己写滑动逻辑要专业得多。

**为什么要用它？**

- **体积小**：只有 3KB（gzipped）
- **性能强**：使用硬件加速，60fps 流畅
- **体验好**：支持触摸滑动、惯性滚动、边界回弹
- **Apple/Adobe 都在用**

**在本项目中的使用**：

```tsx
import useEmblaCarousel from 'embla-carousel-react';

// 创建轮播
const [emblaRef, emblaApi] = useEmblaCarousel({
  loop: false,        // 不循环，有边界
  align: 'center',    // 居中对齐
  dragFree: false,    // 对齐到单张
});

// 使用
<div className={styles.carousel} ref={emblaRef}>
  <div className={styles.carouselContainer}>
    {photos.map(photo => (
      <div key={photo} className={styles.carouselSlide}>
        <img src={photo} />
      </div>
    ))}
  </div>
</div>
```

---

## 三、数据怎么存储？（没有数据库！）

这个网站**没有用数据库**，而是用最简单的方式存数据：**JSON 文件 + 文件夹**。

### 照片存在哪？

```
public/                          ← 这个文件夹里的东西可以直接访问
├── photos/                      ← 所有影集
│   └── ceshi/                   ← 一个叫"ceshi"的影集
│       ├── 01.webp              ← 照片1（压缩后的 WebP）
│       └── 02.webp              ← 照片2
├── thumbnails/                  ← 缩略图
│   └── ceshi/
│       ├── 01.webp              ← 缩略图1（54×54px）
│       └── 02.webp              ← 缩略图2
└── albums.json                  ← 所有影集的元数据
```

### albums.json 是什么？

这是一个**JSON 格式的文本文件**，记录了所有影集的信息：

```json
{
  "albums": [
    {
      "name": "ceshi",
      "title": "测试影集",
      "subtitle": "这是一个测试用的影集",
      "photos": ["01.webp", "02.webp"],
      "photoInfos": {
        "01": { "title": "照片1", "desc": "这是第一张照片" },
        "02": { "title": "照片2", "desc": "这是第二张照片" }
      },
      "hasBgm": false
    }
  ]
}
```

**为什么不用数据库？**

- 简单：不需要配置 MySQL、MongoDB
- 方便：直接丢文件进去，运行脚本就行
- 适合：内容更新不频繁的个人网站

---

## 四、各个页面是怎么工作的？

### 1. 首页 (`/`)

**简化流程**：

```
用户打开首页
    ↓
服务器读取 albums.json 获取所有照片
    ↓
把照片列表传给 React 组件
    ↓
React 用网格布局渲染照片
    ↓
用户看到照片墙
    ↓
用户点击照片
    ↓
打开 Lightbox（灯箱）组件，显示大图 + EXIF
```

---

### 2. 影集列表页 (`/collections`)

**简化流程**：

```
用户访问 /collections
    ↓
服务器读取 albums.json
    ↓
解析出所有影集信息
    ↓
渲染成网格布局
    ↓
用户点击某个影集
    ↓
跳转到 /album/[影集名字]
```

---

### 3. 影集内容页 (`/album/xxx`) —— 最复杂的页面

**简化流程**：

```
用户访问 /album/ceshi
    ↓
服务器读取 albums.json 中 "ceshi" 影集的信息
    ↓
渲染页面结构
    ↓
用户看到：
    - 桌面端：左边照片轮播 + 右边信息栏
    - 移动端：照片轮播 + 控制按钮（隐藏）+ 可折叠面板
    ↓
用户左右滑动或点击缩略图
    ↓
Embla Carousel 切换到对应照片
    ↓
更新当前照片的信息（标题、描述、EXIF）
```

**移动端特殊交互**：

```
用户点击照片区域
    ↓
控制按钮栏显示（从高度0展开）
    ↓
照片区域压缩（0.8s 惯性动画）
    ↓
用户再次点击照片
    ↓
控制按钮栏隐藏
    ↓
照片区域撑满（0.8s 惯性动画）
```

```
用户点击"展开"按钮（▲）或从底部上滑
    ↓
下面板升起（translateY 动画）
    ↓
顶部信息栏渐显（opacity 动画）
    ↓
用户看到照片标题、描述、EXIF、缩略图
```

---

## 五、关键交互的实现原理

### 1. 灯箱（Lightbox）

**原理**：

- 灯箱是一个**全屏覆盖层**（`position: fixed; inset: 0`）
- 背景是半透明的黑色（`rgba(0, 0, 0, 0.92)`）
- 照片居中显示
- 点击背景或 X 按钮关闭

**键盘支持**：

```typescript
useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft') onPrev();
    if (e.key === 'ArrowRight') onNext();
  };
  document.addEventListener('keydown', handleKeyDown);
}, []);
```

---

### 2. Embla Carousel 轮播

**原理**：

- 所有照片横向排列在一个长条容器里
- 通过 `transform: translateX()` 移动容器来切换照片
- 监听触摸/鼠标事件，计算滑动距离
- 使用硬件加速（GPU）保证流畅

**关键配置**：

```typescript
{
  loop: false,        // 不循环，首张和末张有边界
  align: 'center',    // 照片居中
  dragFree: false,    // 松手后自动对齐到单张
}
```

**切换策略**：

- **滑动/按钮切换**：平滑动画（350ms）
- **缩略图远距离跳转**：硬切，瞬间切换（不经过中间照片）

---

### 3. 移动端控制按钮显隐

**状态管理**：

```typescript
const [showMobileControls, setShowMobileControls] = useState(false);
```

**切换逻辑**：

```typescript
const toggleMobileControls = () => {
  setShowMobileControls(prev => !prev);
};

// 点击照片时触发
<div onClick={toggleMobileControls}>
```

**CSS 动画**：

```css
/* 默认隐藏 */
.mobileControls {
  height: 0;
  opacity: 0;
  transition: height 0.3s ease, opacity 0.3s ease;
}

/* 显示状态 */
.showMobileControls .mobileControls {
  height: auto;  /* 展开 */
  opacity: 1;
}
```

---

### 4. 照片区域惯性动画

**原理**：

当控制按钮显示/隐藏时，照片区域需要自适应调整大小。为了让这个调整更自然，使用了：

- **长时长**：0.8s（比按钮动画慢）
- **延迟**：0.05s（等按钮先动）
- **缓动曲线**：`cubic-bezier(0.25, 0.46, 0.45, 0.94)`（惯性效果）

```css
.carousel {
  transition: height 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.05s;
}
```

这样看起来就像照片区域有"惯性"，不是被按钮"顶"了一下，而是自然地跟着变化。

---

### 5. 夜间模式

**原理**：

- 用一个状态 `isDarkMode` 记录当前模式
- 根据状态给容器添加/移除 `.dark` 类名
- CSS 中定义 `.dark` 下的颜色变量

```css
.container.dark {
  --bg-primary: #1a1a1a;
  --text-primary: #e5e5e5;
}
```

---

## 六、状态管理（数据怎么流动）

### React 的 useState —— 组件的"记忆"

React 组件是**函数**，正常情况下函数执行完就"忘"了。`useState` 让组件能"记住"一些东西。

**AlbumView 组件中的状态**：

```typescript
const [currentIndex, setCurrentIndex] = useState(0);        // 当前显示第几张照片
const [isDarkMode, setIsDarkMode] = useState(false);       // 是否夜间模式
const [isPanelOpen, setIsPanelOpen] = useState(false);     // 面板是否展开
const [showMobileControls, setShowMobileControls] = useState(false); // 控制按钮是否显示
```

**状态变化触发重新渲染**：

```
用户点击"下一张"按钮
    ↓
setCurrentIndex(currentIndex + 1)
    ↓
React 检测到状态变了
    ↓
重新渲染组件（显示新照片）
    ↓
Embla Carousel 滑动到新照片
```

---

## 七、开发工作流

### 1. 添加新照片

```
1. 把原图文件放到 originals/[影集名]/
2. 运行 python scripts/process_photos.py
3. 可选：访问 /admin 编辑照片标题和描述
4. 刷新网页，自动生效
```

### 2. 添加新影集

```
1. 在 originals/ 下新建文件夹
2. 放入照片
3. 运行处理脚本
4. 访问 /collections 查看
```

### 3. 修改样式

```
1. 找到对应的 .module.css 文件
2. 修改 CSS
3. 保存，热更新自动刷新浏览器
```

---

## 八、技术选型总结

| 技术 | 为什么选它 | 如果不用会怎样 |
|------|-----------|---------------|
| Next.js | 功能全、生态好、支持静态导出 | 要自己处理路由、构建、优化 |
| React | 组件化、社区大 | 代码难以维护，复用性差 |
| TypeScript | 减少 bug、提高代码质量 | 运行时错误增加，重构困难 |
| CSS Modules | 样式隔离、无命名冲突 | 样式互相覆盖，调试困难 |
| Embla Carousel | 轻量、流畅、专业 | 自己写轮播，性能差、bug 多 |
| JSON 存储 | 简单、无需配置数据库 | 不适合大量数据、并发访问 |

---

## 九、给新手开发者的建议

### 如果你想修改这个网站...

1. **先看 `DesignSpec.md`** —— 了解设计规范，别破坏整体风格
2. **从简单修改开始** —— 改改颜色、文字，熟悉代码结构
3. **善用浏览器的开发者工具** —— 右键"检查"，看元素和样式
4. **看报错信息** —— TypeScript 会在编辑器里标红错误
5. **从模仿开始** —— 看看现有组件怎么写的，依葫芦画瓢

### 常用调试技巧

```
1. console.log() —— 打印变量值
2. debugger —— 断点调试
3. React Developer Tools —— 浏览器插件，看组件树
4. Network 面板 —— 看 API 请求和响应
```

---

## 总结

这个网站的核心架构可以概括为：

```
Next.js (框架)
    ├── React (UI)
    │       ├── 组件化开发
    │       ├── 状态管理 (useState)
    │       └── Embla Carousel (轮播)
    ├── CSS Modules (样式)
    └── JSON 文件 (数据存储)
```

整体思路是**保持简单**：不需要数据库、不需要复杂的状态管理库、不需要服务器渲染的复杂配置。这种架构非常适合**个人摄影作品集**这类内容相对静态、更新频率不高的网站。

希望这份文档能帮助你理解这个项目的运作原理！
