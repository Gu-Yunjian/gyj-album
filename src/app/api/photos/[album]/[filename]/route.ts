// api/photos/[album]/[filename]/route.ts - 获取照片 EXIF 信息
import { NextRequest, NextResponse } from 'next/server';
import { getExifInfo } from '@/lib/exif';
import path from 'path';
import fs from 'fs/promises';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ album: string; filename: string }> }
) {
  try {
    const { album, filename } = await params;

    // home-photos 目录在 public/ 下，其他相册在 public/photos/ 下
    let photoPath: string;
    if (album === 'home-photos') {
      photoPath = path.join(process.cwd(), 'public/home-photos', filename);
    } else {
      photoPath = path.join(process.cwd(), 'public/photos', album, filename);
    }

    // 检查文件是否存在
    try {
      await fs.access(photoPath);
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const exif = await getExifInfo(photoPath);

    return NextResponse.json(exif || {});
  } catch (error) {
    console.error('Error reading EXIF:', error);
    return NextResponse.json({ error: 'Failed to read EXIF' }, { status: 500 });
  }
}
