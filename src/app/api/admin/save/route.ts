import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-static';

const ROOT_DIR = path.resolve(process.cwd());
const ALBUMS_JSON_PATH = path.join(ROOT_DIR, 'public', 'albums.json');
const CONTENT_DIR = path.join(ROOT_DIR, 'public', 'content');

// 保存 albums.json 或任意内容文件
export async function POST(request: NextRequest) {
  // 注意：生产环境应该添加身份验证

  try {
    const data = await request.json();
    
    // 如果指定了自定义路径，保存到该路径
    if (data.path && data.content !== undefined) {
      const targetPath = path.join(ROOT_DIR, data.path);
      
      // 安全检查：确保路径在 public/content 目录下
      if (!targetPath.startsWith(CONTENT_DIR)) {
        return NextResponse.json({ error: '不允许的路径' }, { status: 403 });
      }
      
      // 确保目录存在
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      
      // 写入文件
      await fs.writeFile(targetPath, data.content, 'utf-8');
      
      return NextResponse.json({ 
        success: true, 
        message: `已保存到 ${data.path}` 
      });
    }
    
    // 否则保存 albums.json
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
