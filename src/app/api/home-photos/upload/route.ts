// api/home-photos/upload/index.ts - 上传首页精选照片 API
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const HOME_PHOTOS_DIR = path.join(process.cwd(), 'public/home-photos');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: '请选择文件' }, { status: 400 });
    }

    // 确保目录存在
    try {
      await fs.access(HOME_PHOTOS_DIR);
    } catch {
      await fs.mkdir(HOME_PHOTOS_DIR, { recursive: true });
    }

    // 生成文件名
    const ext = path.extname(file.name).toLowerCase();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const filename = `${timestamp}-${random}${ext}`;
    const savePath = path.join(HOME_PHOTOS_DIR, filename);

    // 写入文件
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(savePath, buffer);

    return NextResponse.json({
      success: true,
      filename,
      path: `/home-photos/${filename}`,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: '上传失败' }, { status: 500 });
  }
}

// 删除首页精选照片
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json({ error: '文件名不能为空' }, { status: 400 });
    }

    const filePath = path.join(HOME_PHOTOS_DIR, filename);

    try {
      await fs.unlink(filePath);
    } catch {
      return NextResponse.json({ error: '文件不存在' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
