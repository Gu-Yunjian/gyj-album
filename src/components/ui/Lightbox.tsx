'use client';

import { useEffect, useCallback, useState } from 'react';
import Image from 'next/image';
import styles from './Lightbox.module.css';

interface PhotoItem {
  src: string;
  alt: string;
  album?: string;
  index?: string;
}

interface LightboxProps {
  photos: PhotoItem[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function Lightbox({
  photos,
  currentIndex,
  isOpen,
  onClose,
  onPrev,
  onNext,
}: LightboxProps) {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [exifData, setExifData] = useState<{ aperture?: string; shutterSpeed?: string; iso?: number } | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft') onPrev();
    if (e.key === 'ArrowRight') onNext();
  }, [onClose, onPrev, onNext]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  // 获取图片尺寸
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
  };

  // 禁止右键菜单
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  // 禁止拖拽
  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // 加载 EXIF 信息
  useEffect(() => {
    const currentPhoto = photos[currentIndex];
    // 如果没有 album 信息，跳过
    if (!currentPhoto?.album) {
      setExifData(null);
      return;
    }

    async function loadExif() {
      try {
        // 从 src 中提取文件名
        const album = currentPhoto.album || '';
        const filename = (currentPhoto.src.split('/').pop() || '') as string;
        const res = await fetch(`/api/photos/${encodeURIComponent(album)}/${encodeURIComponent(filename)}`);
        if (res.ok) {
          const data = await res.json();
          setExifData(data);
        } else {
          setExifData(null);
        }
      } catch {
        setExifData(null);
      }
    }
    loadExif();
  }, [currentIndex, photos]);

  // 格式化 EXIF 显示 - 只显示光圈、快门速度、ISO
  const formatExif = () => {
    if (!exifData) return null;
    const parts: string[] = [];

    if (exifData.aperture) parts.push(exifData.aperture);
    if (exifData.shutterSpeed) parts.push(exifData.shutterSpeed);
    if (exifData.iso) parts.push(`ISO ${exifData.iso}`);

    return parts.length > 0 ? parts.join(' · ') : null;
  };

  if (!isOpen || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];
  const exifDisplay = formatExif();

  return (
    <div className={styles.overlay} onClick={onClose} onContextMenu={handleContextMenu}>
      {/* Close button */}
      <button className={styles.closeBtn} onClick={onClose}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      {/* Navigation */}
      <button className={styles.prevBtn} onClick={(e) => { e.stopPropagation(); onPrev(); }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      <button className={styles.nextBtn} onClick={(e) => { e.stopPropagation(); onNext(); }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {/* Image container */}
      <div className={styles.content} onClick={(e) => e.stopPropagation()}>
        <div className={styles.imageContainer} onContextMenu={handleContextMenu}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentPhoto.src}
            alt={currentPhoto.alt}
            className={styles.image}
            onLoad={handleImageLoad}
            draggable={false}
            onDragStart={handleDragStart}
          />
          {/* Info overlay - positioned at bottom of image */}
          <div className={styles.info}>
            <p className={styles.title}>{currentPhoto.alt}</p>
            {exifDisplay && <p className={styles.exif}>{exifDisplay}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
