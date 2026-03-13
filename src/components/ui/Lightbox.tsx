'use client';

import { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Lightbox.module.css';

interface ExifInfo {
  aperture?: string;
  shutterSpeed?: string;
  iso?: number;
}

interface PhotoItem {
  src: string;
  alt: string;
  photoTitle?: string;
  album?: string;
  albumTitle?: string;
  index?: string;
  exif?: ExifInfo;
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
  const router = useRouter();
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

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

  // 格式化 EXIF 显示
  const formatExif = (exif?: ExifInfo): string | null => {
    if (!exif) return null;
    const parts: string[] = [];
    if (exif.aperture) parts.push(exif.aperture);
    if (exif.shutterSpeed) parts.push(exif.shutterSpeed);
    if (exif.iso) parts.push(`ISO ${exif.iso}`);
    return parts.length > 0 ? parts.join(' · ') : null;
  };

  // 跳转到影集页面
  const handleAlbumClick = () => {
    if (currentPhoto.album && currentPhoto.index) {
      onClose();
      router.push(`/album/${encodeURIComponent(currentPhoto.album)}?photo=${encodeURIComponent(currentPhoto.index)}`);
    }
  };

  if (!isOpen || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];
  const exifDisplay = formatExif(currentPhoto.exif);

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
          {/* Info overlay - positioned at bottom left */}
          <div className={styles.info}>
            {currentPhoto.albumTitle && (
              <button 
                className={styles.albumLink}
                onClick={(e) => { e.stopPropagation(); handleAlbumClick(); }}
              >
                <span>{currentPhoto.albumTitle}</span>
                <svg className={styles.arrowIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            )}
            {currentPhoto.photoTitle && <p className={styles.title}>{currentPhoto.photoTitle}</p>}
            {exifDisplay && <p className={styles.exif}>{exifDisplay}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
