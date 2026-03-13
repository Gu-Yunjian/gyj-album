import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-static';

// 确保在开发环境运行
const isDevelopment = process.env.NODE_ENV === 'development';

// 项目根目录（使用 path.resolve 确保正确）
const ROOT_DIR = path.resolve(process.cwd());
const ORIGINALS_DIR = path.join(ROOT_DIR, 'originals');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

// 确保目录存在
async function ensureDirectories() {
  try {
    await fs.mkdir(ORIGINALS_DIR, { recursive: true });
    await fs.mkdir(path.join(PUBLIC_DIR, 'photos'), { recursive: true });
    await fs.mkdir(path.join(PUBLIC_DIR, 'thumbnails'), { recursive: true });
  } catch (e) {
    console.error('创建目录失败:', e);
  }
}

console.log('API 调试信息:');
console.log('  ROOT_DIR:', ROOT_DIR);
console.log('  ORIGINALS_DIR:', ORIGINALS_DIR);
console.log('  isDevelopment:', isDevelopment);

// 初始化目录
ensureDirectories();

// 验证影集名称
function validateAlbumName(name: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(name);
}

// 获取影集文件列表
export async function GET(request: NextRequest) {
  // 注意：生产环境应该添加身份验证
  // if (!isDevelopment) {
  //   return NextResponse.json({ error: '仅开发环境可用' }, { status: 403 });
  // }

  let albumName = '';

  try {
    const { searchParams } = new URL(request.url);
    const album = searchParams.get('album');
    albumName = album || '';

    if (!album || !validateAlbumName(album)) {
      return NextResponse.json({ error: '无效的影集名称' }, { status: 400 });
    }

    const albumDir = path.join(ORIGINALS_DIR, album);
    
    // 确保目录存在
    await fs.mkdir(albumDir, { recursive: true });
    
    const files = await fs.readdir(albumDir);
    const photos = files.filter(f => 
      /\.(jpg|jpeg|png|webp|heic|heif)$/i.test(f)
    );

    return NextResponse.json({ photos });
  } catch (error: any) {
    console.error('读取文件列表失败:', error);
    return NextResponse.json({ 
      error: '读取失败', 
      details: error.message,
      path: path.join(ORIGINALS_DIR, albumName || 'unknown')
    }, { status: 500 });
  }
}

// 上传文件
export async function POST(request: NextRequest) {
  // 注意：生产环境应该添加身份验证

  try {
    const formData = await request.formData();
    const album = formData.get('album') as string;
    const files = formData.getAll('files') as File[];

    if (!album || !validateAlbumName(album)) {
      return NextResponse.json({ error: '无效的影集名称' }, { status: 400 });
    }

    if (files.length === 0) {
      return NextResponse.json({ error: '没有选择文件' }, { status: 400 });
    }

    const albumDir = path.join(ORIGINALS_DIR, album);
    await fs.mkdir(albumDir, { recursive: true });

    const savedFiles: string[] = [];

    for (const file of files) {
      // 清理文件名
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = path.join(albumDir, cleanName);
      
      // 写入文件
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(filePath, buffer);
      savedFiles.push(cleanName);
    }

    return NextResponse.json({ 
      success: true, 
      message: `成功上传 ${savedFiles.length} 个文件`,
      files: savedFiles 
    });
  } catch (error) {
    console.error('上传失败:', error);
    return NextResponse.json({ error: '上传失败' }, { status: 500 });
  }
}

// 删除文件
export async function DELETE(request: NextRequest) {
  // 注意：生产环境应该添加身份验证

  try {
    const { searchParams } = new URL(request.url);
    const album = searchParams.get('album');
    const filename = searchParams.get('filename');

    if (!album || !validateAlbumName(album) || !filename) {
      return NextResponse.json({ error: '无效参数' }, { status: 400 });
    }

    // 防止路径遍历
    if (filename.includes('..') || filename.includes('/')) {
      return NextResponse.json({ error: '无效文件名' }, { status: 400 });
    }

    // 删除原图
    const originalPath = path.join(ORIGINALS_DIR, album, filename);
    try {
      await fs.unlink(originalPath);
    } catch {
      // 文件可能不存在，忽略
    }

    // 同时删除处理后的文件（如果存在）
    const stem = filename.replace(/\.[^/.]+$/, '');
    const processedPath = path.join(PUBLIC_DIR, 'photos', album, `${stem}.webp`);
    const thumbnailPath = path.join(PUBLIC_DIR, 'thumbnails', album, `${stem}.webp`);
    
    try { await fs.unlink(processedPath); } catch {}
    try { await fs.unlink(thumbnailPath); } catch {}

    return NextResponse.json({ 
      success: true, 
      message: '文件已删除' 
    });
  } catch (error) {
    console.error('删除失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
