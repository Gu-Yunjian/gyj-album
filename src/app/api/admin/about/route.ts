import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-static';

const ROOT_DIR = path.resolve(process.cwd());
const ABOUT_MD_PATH = path.join(ROOT_DIR, 'public', 'content', 'about.md');

// 读取 about.md
export async function GET() {
  try {
    const content = await fs.readFile(ABOUT_MD_PATH, 'utf-8');
    return NextResponse.json({ content });
  } catch (error) {
    console.error('读取失败:', error);
    return NextResponse.json({ error: '读取失败' }, { status: 500 });
  }
}

// 保存 about.md
export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: '无效的内容' }, { status: 400 });
    }

    await fs.writeFile(ABOUT_MD_PATH, content, 'utf-8');

    return NextResponse.json({
      success: true,
      message: '已保存到 public/content/about.md'
    });
  } catch (error) {
    console.error('保存失败:', error);
    return NextResponse.json({ error: '保存失败' }, { status: 500 });
  }
}
