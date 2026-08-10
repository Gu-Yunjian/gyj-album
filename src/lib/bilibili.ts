export type ParsedBilibiliVideo = {
  kind: 'bvid' | 'aid';
  value: string;
  page: number;
};

const BVID_PATTERN = /^BV[0-9A-Za-z]{10}$/;
const AID_PATH_PATTERN = /^av([0-9]+)$/i;

function isBilibiliHostname(hostname: string) {
  const normalized = hostname.toLowerCase();
  return normalized === 'bilibili.com' || normalized.endsWith('.bilibili.com');
}

function parsePage(url: URL) {
  const value = url.searchParams.get('p') ?? url.searchParams.get('page') ?? '1';
  const page = Number.parseInt(value, 10);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function parseBilibiliUrl(rawUrl: string): ParsedBilibiliVideo | null {
  let url: URL;

  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }

  if (!['http:', 'https:'].includes(url.protocol) || !isBilibiliHostname(url.hostname)) {
    return null;
  }

  const page = parsePage(url);
  const queryBvid = url.searchParams.get('bvid');

  if (queryBvid && BVID_PATTERN.test(queryBvid)) {
    return { kind: 'bvid', value: queryBvid, page };
  }

  const queryAid = url.searchParams.get('aid');

  if (queryAid && /^[0-9]+$/.test(queryAid)) {
    return { kind: 'aid', value: queryAid, page };
  }

  const videoSegment = url.pathname
    .split('/')
    .find(segment => BVID_PATTERN.test(segment) || AID_PATH_PATTERN.test(segment));

  if (!videoSegment) {
    return null;
  }

  if (BVID_PATTERN.test(videoSegment)) {
    return { kind: 'bvid', value: videoSegment, page };
  }

  const aid = videoSegment.match(AID_PATH_PATTERN)?.[1];
  return aid ? { kind: 'aid', value: aid, page } : null;
}

export function canonicalizeBilibiliUrl(video: ParsedBilibiliVideo) {
  const identifier = video.kind === 'bvid' ? video.value : `av${video.value}`;
  const url = new URL(`/video/${identifier}/`, 'https://www.bilibili.com');

  if (video.page > 1) {
    url.searchParams.set('p', String(video.page));
  }

  return url.toString();
}

export function buildBilibiliPlayerUrl(video: ParsedBilibiliVideo) {
  const url = new URL('https://player.bilibili.com/player.html');
  url.searchParams.set(video.kind, video.value);
  url.searchParams.set('page', String(video.page));
  url.searchParams.set('high_quality', '1');
  url.searchParams.set('as_wide', '1');
  url.searchParams.set('danmaku', '0');
  return url.toString();
}
