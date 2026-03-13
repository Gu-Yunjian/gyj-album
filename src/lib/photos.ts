// lib/photos.ts - 照片数据读取 (从 JSON 文件加载)

import { promises as fs } from 'fs';
import path from 'path';

export interface ExifInfo {
  aperture?: string;
  shutterSpeed?: string;
  iso?: number;
  dateTaken?: string;
  camera?: string;
}

export interface PhotoInfo {
  title: string;
  desc: string;
  exif?: ExifInfo;
}

export interface Photo {
  filename: string;
  originalName: string;
  mainSize: number;
  thumbSize: number;
  exif?: ExifInfo;
  title?: string;
  desc?: string;
}

export interface AlbumInfo {
  name: string;
  title: string;
  subtitle: string;
  cover: string;
  photos: string[]; // photo filenames
  photoInfos: Record<string, PhotoInfo>;
  hasBgm: boolean;
}

export interface GalleryPhoto {
  src: string;
  thumbSrc: string;
  album: string;
  albumTitle: string;
  index: string; // photo stem (filename without extension)
  info?: PhotoInfo;
  exif?: ExifInfo;
}

export interface AlbumsData {
  albums: AlbumInfo[];
  allPhotos: Record<string, Photo>; // key: "albumName/photoStem"
}

// 在服务器端直接读取 JSON 文件
async function loadDataFromFile(): Promise<AlbumsData> {
  try {
    const jsonPath = path.join(process.cwd(), 'public', 'albums.json');
    const data = await fs.readFile(jsonPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load albums metadata:', error);
    return { albums: [], allPhotos: {} };
  }
}

// 客户端使用 fetch
async function loadDataFromFetch(): Promise<AlbumsData> {
  try {
    const response = await fetch('/albums.json');
    if (!response.ok) {
      throw new Error('Failed to load albums metadata');
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to load albums metadata:', error);
    return { albums: [], allPhotos: {} };
  }
}

// 判断是否在服务器端
function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * 加载影集数据
 */
async function loadAlbumsData(): Promise<AlbumsData> {
  if (isServer()) {
    return loadDataFromFile();
  } else {
    return loadDataFromFetch();
  }
}

/**
 * 获取所有影集
 */
export async function getAlbums(): Promise<AlbumInfo[]> {
  const data = await loadAlbumsData();
  return data.albums;
}

/**
 * 获取单个影集
 */
export async function getAlbum(name: string): Promise<AlbumInfo | null> {
  const albums = await getAlbums();
  return albums.find(a => a.name === name) || null;
}

/**
 * 获取所有照片（平铺，用于首页展示）
 */
export async function getAllPhotos(): Promise<GalleryPhoto[]> {
  const data = await loadAlbumsData();
  const photos: GalleryPhoto[] = [];
  
  for (const album of data.albums) {
    for (const photoFilename of album.photos) {
      const stem = photoFilename.replace(/\.[^/.]+$/, '');
      const key = `${album.name}/${stem}`;
      const photoData = data.allPhotos[key];
      
      if (photoData) {
        photos.push({
          src: `/photos/${album.name}/${photoData.filename}`,
          thumbSrc: `/thumbnails/${album.name}/${photoData.filename}`,
          album: album.name,
          albumTitle: album.title,
          index: stem,
          info: album.photoInfos[stem],
          exif: photoData.exif,
        });
      }
    }
  }
  
  return photos.sort((a, b) => a.index.localeCompare(b.index));
}

/**
 * 获取首页照片（从所有影集中聚合）
 */
export async function getHomePhotos(): Promise<GalleryPhoto[]> {
  return getAllPhotos();
}

/**
 * 获取单张照片
 */
export async function getPhoto(albumName: string, photoStem: string): Promise<GalleryPhoto | null> {
  const album = await getAlbum(albumName);
  if (!album) return null;
  
  const data = await loadAlbumsData();
  const key = `${albumName}/${photoStem}`;
  const photoData = data.allPhotos[key];
  
  if (!photoData) return null;
  
  return {
    src: `/photos/${albumName}/${photoData.filename}`,
    thumbSrc: `/thumbnails/${albumName}/${photoData.filename}`,
    album: albumName,
    albumTitle: album.title,
    index: photoStem,
    info: album.photoInfos[photoStem],
    exif: photoData.exif,
  };
}

/**
 * 获取照片数量统计
 */
export async function getPhotoCount(): Promise<number> {
  const data = await loadAlbumsData();
  return Object.keys(data.allPhotos).length;
}

/**
 * 获取所有照片原始数据（用于影集页面）
 */
export async function getAllPhotosData(): Promise<AlbumsData['allPhotos']> {
  const data = await loadAlbumsData();
  return data.allPhotos;
}

/**
 * 清除缓存（用于重新验证）
 */
export function clearCache() {
  // 无缓存需要清除
}
