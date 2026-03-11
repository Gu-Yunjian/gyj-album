// api/albums/[name]/index.ts - 单个影集管理 API
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';

const PHOTOS_DIR = path.join(process.cwd(), 'public/photos');

interface PhotoInfo {
  title: string;
  desc: string;
}

// 获取单个影集信息
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const albumPath = path.join(PHOTOS_DIR, name);

    try {
      await fs.access(albumPath);
    } catch {
      return NextResponse.json({ error: '影集不存在' }, { status: 404 });
    }

    const files = await fs.readdir(albumPath);

    let title = name;
    let subtitle = '';
    let photoInfos: Record<string, PhotoInfo> = {};

    if (files.includes('info.txt')) {
      try {
        const infoContent = await fs.readFile(path.join(albumPath, 'info.txt'), 'utf-8');
        const info = JSON.parse(infoContent);
        title = info.title || name;
        subtitle = info.subtitle || '';
        photoInfos = info.photos || {};
      } catch (e) {
        console.error(`Failed to parse info.txt for ${name}:`, e);
      }
    }

    const photosList = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) && file !== 'cover.jpg';
      })
      .sort();

    const cover = files.includes('cover.jpg') ? 'cover.jpg' : photosList[0];
    const hasBgm = files.some(file => file.toLowerCase().startsWith('bgm.'));

    return NextResponse.json({
      name,
      title,
      subtitle,
      cover,
      photos: photosList,
      photoInfos,
      hasBgm,
    });
  } catch (error) {
    console.error('Error fetching album:', error);
    return NextResponse.json({ error: 'Failed to fetch album' }, { status: 500 });
  }
}

// 更新影集信息
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const body = await request.json();
    const { title, subtitle, photoInfos } = body;

    const albumPath = path.join(PHOTOS_DIR, name);

    try {
      await fs.access(albumPath);
    } catch {
      return NextResponse.json({ error: '影集不存在' }, { status: 404 });
    }

    // 读取现有 info.txt
    let existingInfo: any = {};
    const infoPath = path.join(albumPath, 'info.txt');

    try {
      const content = await fs.readFile(infoPath, 'utf-8');
      existingInfo = JSON.parse(content);
    } catch {
      // 文件不存在或解析失败，使用默认值
    }

    // 更新信息
    const info = {
      ...existingInfo,
      title: title || name,
      subtitle: subtitle || '',
      photos: photoInfos || existingInfo.photos || {},
    };

    await fs.writeFile(infoPath, JSON.stringify(info, null, 2), 'utf-8');

    // 清除缓存
    revalidatePath('/');
    revalidatePath('/collections');
    revalidatePath('/api/albums');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating album:', error);
    return NextResponse.json({ error: 'Failed to update album' }, { status: 500 });
  }
}

// 删除影集
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const albumPath = path.join(PHOTOS_DIR, name);

    try {
      await fs.access(albumPath);
    } catch {
      return NextResponse.json({ error: '影集不存在' }, { status: 404 });
    }

    // 删除整个影集目录
    await fs.rm(albumPath, { recursive: true });

    // 清除缓存
    revalidatePath('/');
    revalidatePath('/collections');
    revalidatePath('/api/albums');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting album:', error);
    return NextResponse.json({ error: 'Failed to delete album' }, { status: 500 });
  }
}
