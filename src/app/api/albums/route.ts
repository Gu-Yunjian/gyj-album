// api/albums/index.ts - 影集管理 API
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';

const PHOTOS_DIR = path.join(process.cwd(), 'public/photos');

interface PhotoInfo {
  title: string;
  desc: string;
}

interface AlbumInfo {
  name: string;
  title: string;
  subtitle: string;
  cover?: string;
  photos?: string[];
  photoInfos?: Record<string, PhotoInfo>;
  hasBgm?: boolean;
}

// 获取所有影集列表
export async function GET() {
  try {
    const entries = await fs.readdir(PHOTOS_DIR, { withFileTypes: true });
    const albums: AlbumInfo[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const albumPath = path.join(PHOTOS_DIR, entry.name);
      const files = await fs.readdir(albumPath);

      let title = entry.name;
      let subtitle = '';
      let photoInfos: Record<string, PhotoInfo> = {};

      if (files.includes('info.txt')) {
        try {
          const infoContent = await fs.readFile(path.join(albumPath, 'info.txt'), 'utf-8');
          const info = JSON.parse(infoContent);
          title = info.title || entry.name;
          subtitle = info.subtitle || '';
          photoInfos = info.photos || {};
        } catch (e) {
          console.error(`Failed to parse info.txt for ${entry.name}:`, e);
        }
      }

      const photosList = files
        .filter(file => {
          const ext = path.extname(file).toLowerCase();
          return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) && file !== 'cover.jpg';
        })
        .sort();

      const cover = files.includes('cover.jpg') ? 'cover.jpg' : photosList[0];

      albums.push({
        name: entry.name,
        title,
        subtitle,
        cover,
        photos: photosList,
        photoInfos,
      });
    }

    return NextResponse.json(albums);
  } catch (error) {
    console.error('Error fetching albums:', error);
    return NextResponse.json({ error: 'Failed to fetch albums' }, { status: 500 });
  }
}

// 创建新影集
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, title, subtitle } = body;

    if (!name) {
      return NextResponse.json({ error: '影集名称不能为空' }, { status: 400 });
    }

    // 创建影集目录
    const albumPath = path.join(PHOTOS_DIR, name);
    await fs.mkdir(albumPath, { recursive: true });

    // 创建默认 info.txt
    const info = {
      title: title || name,
      subtitle: subtitle || '',
      photos: {},
    };
    await fs.writeFile(path.join(albumPath, 'info.txt'), JSON.stringify(info, null, 2), 'utf-8');

    // 清除缓存
    revalidatePath('/');
    revalidatePath('/collections');
    revalidatePath('/api/albums');

    return NextResponse.json({ success: true, name });
  } catch (error) {
    console.error('Error creating album:', error);
    return NextResponse.json({ error: 'Failed to create album' }, { status: 500 });
  }
}
