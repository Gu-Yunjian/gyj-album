# 🚀 部署说明

## 架构概览

```
┌─────────────────────────────────────────────────────────┐
│  本地开发                                                │
│  ├── originals/          ← 原图（不提交到 git）          │
│  ├── public/photos/      ← 压缩后的主图（自动生成的）     │
│  ├── public/thumbnails/  ← 缩略图（自动生成的）          │
│  └── public/photos.json  ← 照片元数据（自动生成的）      │
└─────────────────────────────────────────────────────────┘
                           ↓ git push
┌─────────────────────────────────────────────────────────┐
│  Cloudflare Pages                                       │
│  └── 自动构建部署静态网站                                │
└─────────────────────────────────────────────────────────┘
```

## 快速开始

### 1. 安装依赖

```bash
# Node.js 依赖
npm install

# Python 依赖（用于图片处理）
pip install -r scripts/requirements.txt
```

### 2. 准备照片

将原图放入 `originals/` 目录：

```
originals/
├── photo1.jpg
├── photo2.png
└── ...
```

### 3. 处理图片

运行 Python 脚本压缩图片并提取 EXIF：

```bash
python scripts/process_photos.py
```

这会生成：
- `public/photos/` - 压缩后的主图（WebP，≤1MB）
- `public/thumbnails/` - 缩略图（WebP，≤200KB）
- `public/photos.json` - 照片元数据（EXIF 信息等）

### 4. 本地预览

```bash
npm run dev
```

### 5. 一键部署

Windows:
```bash
scripts\deploy.bat
```

PowerShell:
```bash
.\scripts\deploy.ps1
```

或手动：
```bash
git add .
git commit -m "update photos"
git push origin main
```

## 工作流详解

### 添加新照片

1. **复制原图到 originals/**
   ```bash
   copy D:\Downloads\new-photo.jpg originals\
   ```

2. **处理图片**
   ```bash
   python scripts/process_photos.py
   ```

3. **提交并部署**
   ```bash
   scripts\deploy.bat
   ```

### 删除照片

直接从 `originals/` 删除原图，然后重新运行处理脚本：

```bash
# 删除原图
del originals\photo-to-delete.jpg

# 重新处理（会自动清理已删除的照片）
python scripts/process_photos.py

# 部署
scripts\deploy.bat
```

### 修改照片信息

编辑 `public/photos.json`，找到对应照片添加 `title` 和 `desc`：

```json
{
  "photo1": {
    "filename": "photo1.webp",
    "exif": { ... },
    "title": "夕阳下的海滩",
    "desc": "拍摄于三亚，使用 Canon EOS R5"
  }
}
```

然后提交部署。

## 技术细节

### 图片处理参数

| 类型 | 格式 | 最大大小 | 质量 |
|------|------|----------|------|
| 主图 | WebP | 1MB | 动态调整（最高85） |
| 缩略图 | WebP | 200KB | 动态调整（最高75） |

### 静态导出配置

项目使用 Next.js 静态导出模式 (`output: 'export'`)，构建输出到 `dist/` 目录。

Cloudflare Pages 会自动识别并部署。

### EXIF 信息提取

脚本会自动提取以下 EXIF 信息：
- 光圈 (Aperture)
- 快门速度 (Shutter Speed)
- ISO
- 拍摄时间 (Date Taken)
- 相机型号 (Camera Model)

## 故障排查

### Python 脚本报错

```bash
# 确保安装了依赖
pip install -r scripts/requirements.txt

# 检查 Python 版本（需要 3.8+）
python --version
```

### 图片处理失败

- 检查原图是否为有效的图片格式（JPG/PNG/WEBP）
- 检查原图是否损坏

### 部署后图片不显示

1. 确认 `public/photos.json` 已提交到 git
2. 确认 `public/photos/` 和 `public/thumbnails/` 已提交
3. 检查 Cloudflare Pages 构建日志

### Git 提交失败

```bash
# 检查远程仓库配置
git remote -v

# 检查分支名称
git branch
```

## 文件说明

| 文件/目录 | 说明 |
|-----------|------|
| `originals/` | 原图存放目录（gitignore） |
| `public/photos/` | 压缩后的主图 |
| `public/thumbnails/` | 缩略图 |
| `public/photos.json` | 照片元数据 |
| `scripts/process_photos.py` | 图片处理脚本 |
| `scripts/deploy.bat` | Windows 一键部署脚本 |
| `scripts/deploy.ps1` | PowerShell 一键部署脚本 |
