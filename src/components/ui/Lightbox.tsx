'use client';

import { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import styles from './Lightbox.module.css';

interface ExifInfo {
  aperture?: string;
  shutterSpeed?: string;
  iso?: number;
}

interface PhotoItem {
  src: string;
  previewSrc?: string;
  alt: string;
  photoTitle?: string;
  album?: string;
  albumTitle?: string;
  index?: string;
  width?: number;
  height?: number;
  exif?: ExifInfo;
}

export interface LightboxSourceRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface LightboxProps {
  photos: PhotoItem[];
  currentIndex: number;
  isOpen: boolean;
  sourceRect: LightboxSourceRect | null;
  onClose: () => void;
}

type LightboxPhase = 'opening' | 'open' | 'closing';

const ANIMATION_MS = 360;

function getTargetRect(photo: PhotoItem, sourceRect: LightboxSourceRect | null): LightboxSourceRect {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const maxWidth = viewportWidth * (viewportWidth <= 768 ? 0.95 : 0.85);
  const maxHeight = viewportHeight * (viewportWidth <= 768 ? 0.8 : 0.85);
  const width = photo.width || sourceRect?.width || 4;
  const height = photo.height || sourceRect?.height || 3;
  const aspectRatio = width / height || 4 / 3;

  let targetWidth = maxWidth;
  let targetHeight = targetWidth / aspectRatio;

  if (targetHeight > maxHeight) {
    targetHeight = maxHeight;
    targetWidth = targetHeight * aspectRatio;
  }

  return {
    left: (viewportWidth - targetWidth) / 2,
    top: (viewportHeight - targetHeight) / 2,
    width: targetWidth,
    height: targetHeight,
  };
}

export default function Lightbox({
  photos,
  currentIndex,
  isOpen,
  sourceRect,
  onClose,
}: LightboxProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const [phase, setPhase] = useState<LightboxPhase>('opening');
  const [frameRect, setFrameRect] = useState<LightboxSourceRect | null>(null);
  const [fullImageLoaded, setFullImageLoaded] = useState(false);

  const currentPhoto = photos[currentIndex];

  const targetRect = useMemo(() => {
    if (!isOpen || !currentPhoto || typeof window === 'undefined') return null;
    return getTargetRect(currentPhoto, sourceRect);
  }, [currentPhoto, isOpen, sourceRect]);

  const formatExif = (exif?: ExifInfo): string | null => {
    if (!exif) return null;
    const parts: string[] = [];
    if (exif.aperture) parts.push(exif.aperture);
    if (exif.shutterSpeed) parts.push(exif.shutterSpeed);
    if (exif.iso) parts.push(`ISO ${exif.iso}`);
    return parts.length > 0 ? parts.join(' · ') : null;
  };

  const finishClose = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    onClose();
  }, [onClose]);

  const requestClose = useCallback(() => {
    if (!isOpen || phase === 'closing') return;

    setPhase('closing');
    setFrameRect(sourceRect ?? frameRect);

    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
    }

    closeTimerRef.current = window.setTimeout(finishClose, ANIMATION_MS);
  }, [finishClose, frameRect, isOpen, phase, sourceRect]);

  useEffect(() => {
    if (!isOpen || !targetRect) return;

    setFullImageLoaded(false);
    setPhase('opening');
    setFrameRect(sourceRect ?? targetRect);

    const firstFrame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setFrameRect(targetRect);
      });
    });
    const openTimer = window.setTimeout(() => setPhase('open'), ANIMATION_MS + 40);

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.clearTimeout(openTimer);
    };
  }, [currentIndex, isOpen, sourceRect, targetRect]);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = '';
      previousFocusRef.current?.focus();
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        requestClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, requestClose]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
  };

  if (!isOpen || !currentPhoto || !frameRect) return null;

  const exifDisplay = formatExif(currentPhoto.exif);
  const overlayStyle: CSSProperties = {
    opacity: phase === 'closing' ? 0 : 1,
  };
  const frameStyle: CSSProperties = {
    left: frameRect.left,
    top: frameRect.top,
    width: frameRect.width,
    height: frameRect.height,
  };

  return (
    <div
      className={styles.overlay}
      style={overlayStyle}
      role="dialog"
      aria-modal="true"
      aria-label="照片查看器"
      onClick={requestClose}
      onContextMenu={handleContextMenu}
    >
      <button ref={closeButtonRef} className={styles.closeBtn} onClick={requestClose} aria-label="关闭灯箱">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      <div
        className={styles.imageFrame}
        style={frameStyle}
        onClick={(e) => e.stopPropagation()}
        onContextMenu={handleContextMenu}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentPhoto.previewSrc || currentPhoto.src}
          alt=""
          className={`${styles.image} ${styles.previewImage} ${fullImageLoaded ? styles.previewImageHidden : ''}`}
          draggable={false}
          onDragStart={handleDragStart}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentPhoto.src}
          alt={currentPhoto.alt}
          className={`${styles.image} ${styles.fullImage} ${fullImageLoaded ? styles.fullImageLoaded : ''}`}
          onLoad={() => setFullImageLoaded(true)}
          draggable={false}
          onDragStart={handleDragStart}
        />

        <div className={`${styles.info} ${phase === 'open' ? styles.infoVisible : ''}`}>
          {currentPhoto.albumTitle && currentPhoto.album && (
            <Link
              href={`/album/${encodeURIComponent(currentPhoto.album)}?photo=${encodeURIComponent(currentPhoto.index || '')}`}
              className={styles.albumLink}
              onClick={(e) => e.stopPropagation()}
              prefetch={true}
            >
              <span>来自影集丨{currentPhoto.albumTitle}</span>
              <svg className={styles.arrowIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>
          )}
          {currentPhoto.photoTitle && <p className={styles.title}>{currentPhoto.photoTitle}</p>}
          {exifDisplay && <p className={styles.exif}>{exifDisplay}</p>}
        </div>
      </div>
    </div>
  );
}
