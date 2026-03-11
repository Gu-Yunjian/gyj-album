// lib/photos.ts - 照片数据读取 (Server-side only)
import { getExifInfo, ExifInfo } from './exif';

export interface PhotoInfo {
  title: string;
  desc: string;
  exif?: ExifInfo;
}

export interface AlbumInfo {
  name: string;
  title: string;
  subtitle: string;
  cover: string;
  photos: string[];
  photoInfos: Record<string, PhotoInfo>;
  hasBgm: boolean;
}

export interface GalleryPhoto {
  src: string;
  album: string;
  albumTitle: string;
  index: string;
  info?: PhotoInfo;
  // 首页来源标识
  source?: 'album' | 'home-folder';
}

// 首页统一照片文件夹配置
const HOME_PHOTOS_DIR = 'home-photos';

// 缓存配置 - 5秒过期，保证开发时数据及时更新
const CACHE_TTL = 5000;

// 服务器端数据存储
let albumsCache: AlbumInfo[] | null = null;
let albumsCacheTime = 0;
let photosCache: GalleryPhoto[] | null = null;
let photosCacheTime = 0;
let homePhotosCache: GalleryPhoto[] | null = null;
let homePhotosCacheTime = 0;

// 检查缓存是否过期
function isCacheExpired(cacheTime: number): boolean {
  return Date.now() - cacheTime > CACHE_TTL;
}

/**
 * 获取所有影集信息 (服务端调用)
 */
export async function getAlbums(): Promise<AlbumInfo[]> {
  if (albumsCache && !isCacheExpired(albumsCacheTime)) return albumsCache;

  const fs = await import('fs/promises');
  const path = await import('path');
  const PHOTOS_DIR = path.join(process.cwd(), 'public/photos');

  let entries;
  try {
    entries = await fs.readdir(PHOTOS_DIR, { withFileTypes: true });
  } catch {
    albumsCache = [];
    return [];
  }

  const albums: AlbumInfo[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const albumPath = path.join(PHOTOS_DIR, entry.name);
    const files = await fs.readdir(albumPath);

    // 读取 info.txt
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

    // 获取照片列表
    const photosList = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) && file !== 'cover.jpg';
      })
      .sort();

    const cover = files.includes('cover.jpg') ? 'cover.jpg' : photosList[0];
    const hasBgm = files.some(file => file.toLowerCase().startsWith('bgm.'));

    albums.push({
      name: entry.name,
      title,
      subtitle,
      cover,
      photos: photosList,
      photoInfos,
      hasBgm,
    });
  }

  albumsCache = albums;
  albumsCacheTime = Date.now();
  return albums;
}

/**
 * 获取所有照片 (服务端调用)
 */
export async function getAllPhotos(): Promise<GalleryPhoto[]> {
  if (photosCache && !isCacheExpired(photosCacheTime)) return photosCache;

  const albums = await getAlbums();
  const photos: GalleryPhoto[] = [];

  for (const album of albums) {
    for (const photo of album.photos) {
      const index = photo.replace(/\.[^/.]+$/, '');
      photos.push({
        src: `/photos/${album.name}/${photo}`,
        album: album.name,
        albumTitle: album.title,
        index,
        info: album.photoInfos[index],
        source: 'album',
      });
    }
  }

  photosCache = photos;
  photosCacheTime = Date.now();
  return photos;
}

/**
 * 获取首页照片 - 仅从 home-photos 文件夹获取
 */
export async function getHomePhotos(): Promise<GalleryPhoto[]> {
  if (homePhotosCache && !isCacheExpired(homePhotosCacheTime)) return homePhotosCache;

  const photos: GalleryPhoto[] = [];

  // 仅从 home-photos 文件夹获取
  const fs = await import('fs/promises');
  const path = await import('path');
  const homeDir = path.join(process.cwd(), 'public', HOME_PHOTOS_DIR);

  try {
    const files = await fs.readdir(homeDir);
    const homePhotos = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
      })
      .sort();

    // 读取 home-photos 目录的 info.txt (可选)
    let homePhotoInfos: Record<string, PhotoInfo> = {};
    if (files.includes('info.txt')) {
      try {
        const infoContent = await fs.readFile(path.join(homeDir, 'info.txt'), 'utf-8');
        const info = JSON.parse(infoContent);
        homePhotoInfos = info.photos || {};
      } catch (e) {
        console.error('Failed to parse home-photos info.txt:', e);
      }
    }

    for (const photo of homePhotos) {
      const index = photo.replace(/\.[^/.]+$/, '');
      photos.push({
        src: `/${HOME_PHOTOS_DIR}/${photo}`,
        album: HOME_PHOTOS_DIR,
        albumTitle: '首页精选',
        index,
        info: homePhotoInfos[index] || { title: '', desc: '' },
        source: 'home-folder',
      });
    }
  } catch (e) {
    // home-photos 目录不存在，跳过
    console.log('Home photos folder not found, skipping');
  }

  homePhotosCache = photos;
  homePhotosCacheTime = Date.now();
  return photos;
}

/**
 * 获取单个影集信息
 */
export async function getAlbum(name: string): Promise<AlbumInfo | null> {
  const albums = await getAlbums();
  return albums.find(a => a.name === name) || null;
}

/**
 * 清除缓存 (用于重新验证)
 */
export function clearCache() {
  albumsCache = null;
  photosCache = null;
  homePhotosCache = null;
}
