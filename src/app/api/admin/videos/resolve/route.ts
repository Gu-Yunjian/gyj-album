import { NextRequest, NextResponse } from 'next/server';
import {
  isB23Url,
  validateResolvedBilibiliUrl,
} from '@/lib/bilibili';

export const dynamic = 'force-static';

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const url = body && typeof body === 'object' && 'url' in body
      && typeof body.url === 'string'
      ? body.url.trim()
      : '';

    if (!isB23Url(url)) {
      return NextResponse.json(
        { error: '请输入有效的 b23.tv 短链接' },
        { status: 400 }
      );
    }

    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      cache: 'no-store',
    });
    const canonicalUrl = validateResolvedBilibiliUrl(response.url);

    if (!canonicalUrl) {
      return NextResponse.json(
        { error: '无法解析短链接，请粘贴完整 B 站链接' },
        { status: 400 }
      );
    }

    return NextResponse.json({ url: canonicalUrl });
  } catch (error) {
    console.error('Failed to resolve Bilibili short link:', error);
    return NextResponse.json(
      { error: '无法解析短链接，请粘贴完整 B 站链接' },
      { status: 400 }
    );
  }
}
