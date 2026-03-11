// api/albums/[name]/upload/index.ts - 上传照片 API
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';

const PHOTOS_DIR = path.join(process.cwd(), 'public/photos');

// 解析 multipart form data
async function parseFormData(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const type = formData.get('type') as string | null;

  return { file, type };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const { file, type } = await parseFormData(request);

    if (!file) {
      return NextResponse.json({ error: '请选择文件' }, { status: 400 });
    }

    const albumPath = path.join(PHOTOS_DIR, name);

    try {
      await fs.access(albumPath);
    } catch {
      return NextResponse.json({ error: '影集不存在' }, { status: 404 });
    }

    // 确定保存路径
    let savePath: string;
    if (type === 'cover') {
      savePath = path.join(albumPath, 'cover.jpg');
    } else {
      // 生成文件名：时间戳 + 原始扩展名
      const ext = path.extname(file.name).toLowerCase();
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      const filename = `${timestamp}-${random}${ext}`;
      savePath = path.join(albumPath, filename);
    }

    // 写入文件
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(savePath, buffer);

    const filename = path.basename(savePath);

    // 清除缓存
    revalidatePath('/');
    revalidatePath('/collections');
    revalidatePath('/api/albums');

    return NextResponse.json({
      success: true,
      filename,
      path: `/photos/${name}/${filename}`,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: '上传失败' }, { status: 500 });
  }
}

// 删除照片
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json({ error: '文件名不能为空' }, { status: 400 });
    }

    const albumPath = path.join(PHOTOS_DIR, name);
    const filePath = path.join(albumPath, filename);

    try {
      await fs.unlink(filePath);
    } catch {
      return NextResponse.json({ error: '文件不存在' }, { status: 404 });
    }

    // 清除缓存
    revalidatePath('/');
    revalidatePath('/collections');
    revalidatePath('/api/albums');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
