// lib/photos.ts - 照片数据读取 (从 JSON 文件加载)

export interface PhotoInfo {
  title: string;
  desc: string;
  exif?: ExifInfo;
}

export interface ExifInfo {
  aperture?: string;
  shutterSpeed?: string;
  iso?: number;
  dateTaken?: string;
  camera?: string;
}

export interface PhotoMetadata {
  filename: string;
  originalName: string;
  mainSize: number;
  thumbSize: number;
  exif: ExifInfo;
}

export interface GalleryPhoto {
  src: string;
  thumbSrc: string;
  album: string;
  albumTitle: string;
  index: string;
  info?: PhotoInfo;
  exif?: ExifInfo;
  source?: 'album' | 'home-folder';
}

// 元数据缓存
let metadataCache: Record<string, PhotoMetadata> | null = null;

/**
 * 加载照片元数据
 */
async function loadMetadata(): Promise<Record<string, PhotoMetadata>> {
  if (metadataCache) return metadataCache;
  
  try {
    const response = await fetch('/photos.json');
    if (!response.ok) {
      throw new Error('Failed to load photos metadata');
    }
    metadataCache = await response.json();
    return metadataCache || {};
  } catch (error) {
    console.error('Failed to load photos metadata:', error);
    return {};
  }
}

/**
 * 获取所有照片
 */
export async function getAllPhotos(): Promise<GalleryPhoto[]> {
  const metadata = await loadMetadata();
  const photos: GalleryPhoto[] = [];
  
  for (const [stem, data] of Object.entries(metadata)) {
    photos.push({
      src: `/photos/${data.filename}`,
      thumbSrc: `/thumbnails/${data.filename}`,
      album: 'gallery',
      albumTitle: '相册',
      index: stem,
      exif: data.exif || undefined,
      source: 'album',
    });
  }
  
  // 按文件名排序
  return photos.sort((a, b) => a.index.localeCompare(b.index));
}

/**
 * 获取首页照片（从元数据中筛选或使用全部）
 */
export async function getHomePhotos(): Promise<GalleryPhoto[]> {
  // 目前使用所有照片作为首页照片
  // 后续可以根据需要添加筛选逻辑
  return getAllPhotos();
}

/**
 * 获取单张照片
 */
export async function getPhoto(index: string): Promise<GalleryPhoto | null> {
  const metadata = await loadMetadata();
  const data = metadata[index];
  
  if (!data) return null;
  
  return {
    src: `/photos/${data.filename}`,
    thumbSrc: `/thumbnails/${data.filename}`,
    album: 'gallery',
    albumTitle: '相册',
    index: index,
    exif: data.exif || undefined,
    source: 'album',
  };
}

/**
 * 清除缓存（用于重新验证）
 */
export function clearCache() {
  metadataCache = null;
}

/**
 * 获取照片数量统计
 */
export async function getPhotoCount(): Promise<number> {
  const metadata = await loadMetadata();
  return Object.keys(metadata).length;
}
