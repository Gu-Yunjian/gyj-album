import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-static';

const ROOT_DIR = path.resolve(process.cwd());
const ALBUMS_JSON_PATH = path.join(ROOT_DIR, 'public', 'albums.json');

// 保存 albums.json
export async function POST(request: NextRequest) {
  // 注意：生产环境应该添加身份验证

  try {
    const data = await request.json();
    
    // 验证基本结构
    if (!data.albums || !Array.isArray(data.albums)) {
      return NextResponse.json({ error: '无效的数据格式' }, { status: 400 });
    }

    // 写入文件（格式化，2空格缩进）
    const jsonStr = JSON.stringify(data, null, 2);
    await fs.writeFile(ALBUMS_JSON_PATH, jsonStr, 'utf-8');

    return NextResponse.json({ 
      success: true, 
      message: '已保存到 public/albums.json' 
    });
  } catch (error) {
    console.error('保存失败:', error);
    return NextResponse.json({ error: '保存失败' }, { status: 500 });
  }
}
