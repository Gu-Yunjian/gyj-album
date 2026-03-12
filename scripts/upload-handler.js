#!/usr/bin/env node
/**
 * Admin 上传处理脚本
 * - 接收上传的文件保存到 originals/
 * - 触发 Python 处理脚本
 * - 自动 git commit & push
 * 
 * 用法: node scripts/upload-handler.js <file1> [file2] ...
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ORIGINALS_DIR = path.join(__dirname, '..', 'originals');
const PHOTOS_DIR = path.join(__dirname, '..', 'public', 'photos');

// 确保目录存在
if (!fs.existsSync(ORIGINALS_DIR)) {
  fs.mkdirSync(ORIGINALS_DIR, { recursive: true });
}

/**
 * 处理上传
 */
async function handleUpload(sourceFiles) {
  console.log('📤 开始处理上传...\n');
  
  // 1. 复制文件到 originals/
  const uploadedNames = [];
  for (const sourcePath of sourceFiles) {
    if (!fs.existsSync(sourcePath)) {
      console.error(`❌ 文件不存在: ${sourcePath}`);
      continue;
    }
    
    const filename = path.basename(sourcePath);
    const destPath = path.join(ORIGINALS_DIR, filename);
    
    // 如果已存在，添加数字后缀
    let finalDest = destPath;
    let counter = 1;
    const ext = path.extname(filename);
    const name = path.basename(filename, ext);
    
    while (fs.existsSync(finalDest)) {
      finalDest = path.join(ORIGINALS_DIR, `${name}_${counter}${ext}`);
      counter++;
    }
    
    fs.copyFileSync(sourcePath, finalDest);
    console.log(`✅ 已保存原图: ${path.basename(finalDest)}`);
    uploadedNames.push(path.basename(finalDest));
  }
  
  if (uploadedNames.length === 0) {
    console.log('⚠️  没有文件需要处理');
    return;
  }
  
  console.log(`\n📸 共上传 ${uploadedNames.length} 张原图\n`);
  
  // 2. 触发 Python 处理脚本
  console.log('🔄 正在处理图片压缩...\n');
  try {
    execSync('python scripts/process_photos.py', {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
  } catch (error) {
    console.error('❌ 图片处理失败:', error.message);
    process.exit(1);
  }
  
  console.log('\n✅ 图片处理完成！\n');
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
用法: node scripts/upload-handler.js <file1> [file2] ...

示例:
  node scripts/upload-handler.js ~/Downloads/photo1.jpg
  node scripts/upload-handler.js ~/Downloads/*.jpg

此脚本会:
  1. 将原图复制到 originals/ 目录
  2. 运行 Python 脚本压缩图片并提取 EXIF
  3. 生成 public/photos.json 元数据文件
`);
    process.exit(0);
  }
  
  await handleUpload(args);
}

main().catch(console.error);
