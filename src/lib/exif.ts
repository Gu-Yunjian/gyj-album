// lib/exif.ts - EXIF 信息读取工具
import fs from 'fs/promises';
import path from 'path';
import exifr from 'exifr';

export interface ExifInfo {
  aperture?: string;      // 光圈
  shutterSpeed?: string;  // 快门速度
  iso?: number;           // ISO
}

/**
 * 格式化快门速度
 * 将 ExposureTime 转换为可读的快门速度字符串
 */
function formatShutterSpeed(exposureTime: number): string {
  if (exposureTime >= 1) {
    return `${Math.round(exposureTime * 10) / 10}"`;
  } else {
    const denominator = Math.round(1 / exposureTime);
    return `1/${denominator}s`;
  }
}

/**
 * 格式化光圈
 */
function formatAperture(fNumber: number): string {
  return `f/${fNumber}`;
}

/**
 * 读取照片的 EXIF 信息
 */
export async function getExifInfo(photoPath: string): Promise<ExifInfo | null> {
  try {
    const buffer = await fs.readFile(photoPath);
    
    // 使用 exifr 解析 EXIF
    const exif = await exifr.parse(buffer);

    if (!exif) {
      return null;
    }

    const info: ExifInfo = {};

    // 光圈 (FNumber)
    if (exif.FNumber) {
      info.aperture = formatAperture(exif.FNumber);
    }

    // 快门速度 (ExposureTime)
    if (exif.ExposureTime) {
      info.shutterSpeed = formatShutterSpeed(exif.ExposureTime);
    }

    // ISO
    if (exif.ISO !== undefined && exif.ISO !== null) {
      info.iso = Number(exif.ISO);
    }

    // 如果有任何有效的 EXIF 数据，返回它
    if (info.aperture || info.shutterSpeed || info.iso) {
      return info;
    }

    return null;

  } catch (error) {
    // 不是所有照片都有 EXIF，返回 null
    return null;
  }
}

/**
 * 格式化 EXIF 信息为显示字符串
 */
export function formatExifDisplay(exif: ExifInfo): string {
  const parts: string[] = [];

  if (exif.aperture) parts.push(exif.aperture);
  if (exif.shutterSpeed) parts.push(exif.shutterSpeed);
  if (exif.iso) parts.push(`ISO ${exif.iso}`);

  return parts.join(' · ');
}
