// lib/exif.ts - EXIF 信息工具（从 JSON 数据读取）

export interface ExifInfo {
  aperture?: string;      // 光圈
  shutterSpeed?: string;  // 快门速度
  iso?: number;           // ISO
  dateTaken?: string;     // 拍摄时间
  camera?: string;        // 相机型号
}

/**
 * 格式化 EXIF 信息为显示字符串
 */
export function formatExifDisplay(exif: ExifInfo): string {
  const parts: string[] = [];

  if (exif.aperture) parts.push(exif.aperture);
  if (exif.shutterSpeed) parts.push(exif.shutterSpeed);
  if (exif.iso) parts.push(`ISO ${exif.iso}`);

  return parts.join(' · ') || '';
}

/**
 * 格式化相机型号显示
 */
export function formatCameraDisplay(camera: string | undefined): string {
  if (!camera) return '';
  
  // 清理型号字符串
  return camera
    .replace('Canon ', '')
    .replace('NIKON ', 'Nikon ')
    .replace('SONY ', 'Sony ')
    .replace('FUJIFILM ', 'Fujifilm ')
    .trim();
}

/**
 * 格式化拍摄时间
 */
export function formatDateTaken(dateStr: string | undefined): string {
  if (!dateStr) return '';
  
  try {
    // EXIF 日期格式: "2024:03:15 14:30:00"
    const parts = dateStr.split(' ');
    if (parts.length === 2) {
      const datePart = parts[0].replace(/:/g, '-');
      return datePart;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}
