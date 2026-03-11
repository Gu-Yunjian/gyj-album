# GU-Album 代码库大白话讲解

> 本文用通俗的语言解释这个网站是怎么搭建的，适合非程序员阅读，也适合开发者快速理解整体架构。

---

## 一、先打个比方

想象你要开一家**摄影展览馆**：

- **Next.js** = 展览馆的骨架和基础设施
- **React** = 展览馆里的各种展示柜和互动装置
- **TypeScript** = 施工图纸上的标注，让工人知道每个零件该怎么装
- **CSS** = 展览馆的颜色、灯光、装修风格
- **照片文件** = 展品本身
- **info.txt** = 展品旁边的说明牌

---

## 二、核心技术栈（用了哪些工具）

### 1. Next.js —— 网站的大框架

**这是什么？**

Next.js 是 React 的"增强版"，你可以理解为它是一个**网站的脚手架**，帮你把很多繁琐的事情都做了。

**它帮我们做了什么？**

| 功能 | 大白话解释 | 在本项目中的体现 |
|------|-----------|----------------|
| **路由** | 自动识别网址，显示对应页面 | 你访问 `/album/ceshi`，它就自动显示影集页面 |
| **SSR** | 网页先在服务器上组装好，再发给浏览器 | 打开影集页面时，照片列表已经准备好了 |
| **API 接口** | 可以让前端和后端"打电话" | 获取 EXIF 信息时的 `/api/photos/xxx` |

**简单说**：没有 Next.js，我们要自己写很多代码来处理网址跳转、页面渲染这些基础功能。

---

### 2. React —— 网页的乐高积木

**这是什么？**

React 是 Facebook 开发的 JavaScript 库，核心理念是**组件化**——把网页拆成一个个独立的"积木块"。

**举个例子**：

```
整个网站
├── 导航栏组件 (Navigation)
├── 照片卡片组件 (PhotoCard)
├── 灯箱组件 (Lightbox)
├── 影集展示组件 (AlbumView)
└── ...
```

每个组件都是一个独立的小模块，有自己的样式、逻辑和功能。

**为什么这样设计？**

想象你要做 100 个相同的展示柜：
- 传统方式：手工做 100 个
- React 方式：做一个"展示柜模具"，然后复制 100 次

**本项目中的组件**：

| 组件名 | 作用 | 在哪用 |
|--------|------|--------|
| `Navigation` | 顶部导航栏 | 每个页面都有 |
| `PhotoCard` | 单张照片卡片 | 首页画廊 |
| `GalleryCanvas` | 可拖动的照片画布 | 首页 |
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

### 5. exifr —— 照片的"身份证阅读器"

**这是什么？**

数码相机拍的照片，文件里藏着很多信息（EXIF）：
- 用什么相机拍的
- 光圈多大
- 快门多快
- ISO 多少
- 什么时候拍的

`exifr` 就是一个**读取这些信息的工具**。

**工作流程**：

```
照片文件 (JPEG)
    ↓
exifr 读取
    ↓
提取出：{ 光圈: "f/8", 快门: "1/60s", ISO: 100 }
    ↓
显示在网页上
```

---

## 三、数据怎么存储？（没有数据库！）

这个网站**没有用数据库**，而是用最简单的方式存数据：**文件夹 + 文本文件**。

### 照片存在哪？

```
public/                          ← 这个文件夹里的东西可以直接访问
├── photos/                      ← 所有影集
│   └── ceshi/                   ← 一个叫"ceshi"的影集
│       ├── info.txt             ← 影集的"说明书"
│       ├── cover.jpg            ← 封面
│       ├── bgm.mp3              ← 背景音乐（可选）
│       ├── 01.jpg               ← 照片1
│       └── 02.jpg               ← 照片2
└── home-photos/                 ← 首页精选照片
    ├── 1773226501963.jpg
    └── ...
```

### info.txt 是什么？

每个影集文件夹里的 `info.txt` 是一个**JSON 格式的文本文件**，记录了这个影集的信息：

```json
{
  "title": "测试影集",
  "subtitle": "这是一个测试用的影集",
  "photos": {
    "01": { "title": "照片1", "desc": "这是第一张照片" },
    "02": { "title": "照片2", "desc": "这是第二张照片" }
  }
}
```

**为什么不用数据库？**

- 简单：不需要配置 MySQL、MongoDB
- 方便：直接丢文件进去就行
- 适合：内容更新不频繁的个人网站

---

## 四、各个页面是怎么工作的？

### 1. 首页 (`/`)

**简化流程**：

```
用户打开首页
    ↓
服务器读取 public/photos/ 和 public/home-photos/ 里的所有照片
    ↓
把照片列表传给 React 组件
    ↓
React 用瀑布流布局渲染照片
    ↓
用户看到照片墙
    ↓
用户点击照片
    ↓
打开 Lightbox（灯箱）组件，显示大图 + EXIF
```

**关键技术点**：

- `GalleryCanvas` 组件实现了**可拖动画布**效果
- 照片数据通过 `getHomePhotos()` 函数获取（服务端运行）
- 灯箱是一个" Portal "，渲染在页面最顶层

---

### 2. 影集列表页 (`/collections`)

**简化流程**：

```
用户访问 /collections
    ↓
服务器扫描 public/photos/ 下的所有文件夹
    ↓
读取每个文件夹的 info.txt 获取标题
    ↓
生成影集列表
    ↓
渲染成网格布局
    ↓
用户点击某个影集
    ↓
跳转到 /album/[影集名字]
```

---

### 3. 影集内容页 (`/album/xxx`)

**简化流程**：

```
用户访问 /album/ceshi
    ↓
服务器读取 public/photos/ceshi/ 文件夹
    ↓
获取照片列表和 info.txt
    ↓
渲染双栏布局：左边照片 + 右边信息
    ↓
用户点击左右箭头或缩略图
    ↓
React 切换 currentIndex，显示不同照片
    ↓
同时调用 API 获取当前照片的 EXIF
```

**双栏布局怎么实现的？**

```tsx
<div className={styles.container}>
  <div className={styles.main}>      {/* 左侧 75% */}
    <Image src={当前照片} />
    <button>←</button>               {/* 上一张 */}
    <button>→</button>               {/* 下一张 */}
  </div>
  <aside className={styles.sidebar}> {/* 右侧 320px */}
    <h1>影集标题</h1>
    <p>照片标题</p>
    <p>EXIF 信息</p>
    <div>缩略图列表</div>
  </aside>
</div>
```

---

## 五、前后端怎么交互？

虽然这是一个"静态"网站，但有些功能需要前后端"通话"：

### 场景：获取照片的 EXIF 信息

**为什么需要后端？**

因为浏览器（前端）**不能直接读取用户电脑上的照片文件**（安全限制）。照片必须先上传到服务器，然后服务器读取 EXIF，再告诉前端。

**交互流程**：

```
前端（浏览器）                          后端（服务器）
    │                                        │
    ├──── GET /api/photos/ceshi/01.jpg ─────>│
    │                                        │
    │                                读取文件
    │                                用 exifr 解析 EXIF
    │                                        │
    │<──── {光圈, 快门, ISO} ────────────────┤
    │                                        │
    显示在页面上
```

**代码层面**：

```typescript
// 前端：AlbumView.tsx
const res = await fetch(`/api/photos/${album}/${filename}`);
const exifData = await res.json();

// 后端：app/api/photos/[album]/[filename]/route.ts
export async function GET(request, { params }) {
  const { album, filename } = params;
  const photoPath = path.join(process.cwd(), 'public/photos', album, filename);
  const exif = await getExifInfo(photoPath);
  return NextResponse.json(exif);
}
```

---

## 六、状态管理（数据怎么流动）

### React 的 useState —— 组件的"记忆"

React 组件是**函数**，正常情况下函数执行完就"忘"了。`useState` 让组件能"记住"一些东西。

**本项目中的状态**：

```typescript
// AlbumView.tsx
const [currentIndex, setCurrentIndex] = useState(0);     // 当前显示第几张照片
const [lightboxOpen, setLightboxOpen] = useState(false); // 灯箱是否打开
const [isDarkMode, setIsDarkMode] = useState(false);     // 是否夜间模式
const [exifData, setExifData] = useState(null);          // 当前照片的 EXIF
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
useEffect 检测到 currentIndex 变了
    ↓
调用 API 获取新照片的 EXIF
```

### useEffect —— 处理"副作用"

**什么是副作用？**

组件的主要任务是"渲染界面"。但有些操作不直接产生界面，比如：
- 发送网络请求
- 设置定时器
- 订阅事件

这些就是"副作用"。

**本项目中的 useEffect**：

```typescript
// 当 currentIndex 或 album 变化时，重新加载 EXIF
useEffect(() => {
  async function loadExif() {
    const res = await fetch(`/api/photos/${album}/${currentPhoto}`);
    const data = await res.json();
    setExifData(data);
  }
  loadExif();
}, [currentIndex, album]);
```

---

## 七、关键交互的实现原理

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

### 2. 可拖动画布（GalleryCanvas）

**原理**：

- 监听鼠标/触摸事件（mousedown, mousemove, mouseup）
- 计算拖动距离，更新画布位置（`transform: translate(x, y)`）
- 加入惯性效果（松手后继续滑动一段距离）

### 3. 夜间模式

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

## 八、开发工作流

### 1. 添加新照片

```
1. 把照片文件放到 public/photos/[影集名]/
2. 可选：更新 info.txt 添加照片标题和描述
3. 刷新网页，自动生效
```

### 2. 添加新影集

```
1. 在 public/photos/ 下新建文件夹
2. 放入照片
3. 创建 info.txt 写入影集信息
4. 访问 /collections 查看
```

### 3. 修改样式

```
1. 找到对应的 .module.css 文件
2. 修改 CSS
3. 保存，热更新自动刷新浏览器
```

### 4. 添加新功能

```
1. 在 components/ 下新建组件文件
2. 在需要使用的页面导入组件
3. 可能需要添加新的 API 路由
```

---

## 九、技术选型总结

| 技术 | 为什么选它 | 如果不用会怎样 |
|------|-----------|---------------|
| Next.js | 功能全、生态好、文档完善 | 要自己处理路由、构建、优化 |
| React | 组件化、社区大、招人容易 | 代码难以维护，复用性差 |
| TypeScript | 减少 bug、提高代码质量 | 运行时错误增加，重构困难 |
| CSS Modules | 样式隔离、无命名冲突 | 样式互相覆盖，调试困难 |
| 文件系统存储 | 简单、无需配置数据库 | 不适合大量数据、并发访问 |
| exifr | 专门解析 EXIF、可靠 | 要自己写解析逻辑，容易出错 |

---

## 十、给新手开发者的建议

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
    │       └── 副作用处理 (useEffect)
    ├── CSS Modules (样式)
    ├── API Routes (后端接口)
    └── 文件系统 (数据存储)
```

整体思路是**保持简单**：不需要数据库、不需要复杂的状态管理库、不需要服务器渲染的复杂配置。这种架构非常适合**个人作品集**这类内容相对静态、更新频率不高的网站。

希望这份文档能帮助你理解这个项目的运作原理！
