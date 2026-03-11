// api/home-photos/index.ts - 首页精选照片管理 API
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const HOME_PHOTOS_DIR = path.join(process.cwd(), 'public/home-photos');

interface PhotoInfo {
  title: string;
  desc: string;
}

// 确保目录存在
async function ensureDir() {
  try {
    await fs.access(HOME_PHOTOS_DIR);
  } catch {
    await fs.mkdir(HOME_PHOTOS_DIR, { recursive: true });
  }
}

// 获取首页精选照片列表
export async function GET() {
  try {
    await ensureDir();

    const files = await fs.readdir(HOME_PHOTOS_DIR);

    let photoInfos: Record<string, PhotoInfo> = {};
    if (files.includes('info.txt')) {
      try {
        const infoContent = await fs.readFile(path.join(HOME_PHOTOS_DIR, 'info.txt'), 'utf-8');
        const info = JSON.parse(infoContent);
        photoInfos = info.photos || {};
      } catch (e) {
        console.error('Failed to parse home-photos info.txt:', e);
      }
    }

    const photos = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
      })
      .sort()
      .map(file => {
        const index = file.replace(/\.[^/.]+$/, '');
        return {
          filename: file,
          src: `/home-photos/${file}`,
          info: photoInfos[index] || { title: '', desc: '' },
        };
      });

    return NextResponse.json(photos);
  } catch (error) {
    console.error('Error fetching home photos:', error);
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
  }
}

// 更新首页照片信息
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { photoInfos } = body;

    await ensureDir();

    let existingInfo: any = {};
    const infoPath = path.join(HOME_PHOTOS_DIR, 'info.txt');

    try {
      const content = await fs.readFile(infoPath, 'utf-8');
      existingInfo = JSON.parse(content);
    } catch {
      // 文件不存在，使用默认值
    }

    const info = {
      ...existingInfo,
      photos: photoInfos || {},
    };

    await fs.writeFile(infoPath, JSON.stringify(info, null, 2), 'utf-8');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating home photos:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
