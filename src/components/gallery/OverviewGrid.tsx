'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { GalleryPhoto } from '@/lib/photos';
import styles from './OverviewGrid.module.css';

interface OverviewGridProps {
  photos: GalleryPhoto[];
  onPhotoClick: (index: number, sourceRect: DOMRect) => void;
}

interface IndexedPhoto extends GalleryPhoto {
  originalIndex: number;
}

function getColumnCount() {
  if (typeof window === 'undefined') return 5;
  if (window.innerWidth < 768) return 2;
  if (window.innerWidth < 1200) return 3;
  return 5;
}

function distributePhotos(photos: GalleryPhoto[], columnCount: number) {
  const columns: IndexedPhoto[][] = Array.from({ length: columnCount }, () => []);
  const columnHeights = Array.from({ length: columnCount }, () => 0);

  photos.forEach((photo, originalIndex) => {
    const targetColumn = columnHeights.indexOf(Math.min(...columnHeights));
    const width = photo.width || 4;
    const height = photo.height || 3;

    columns[targetColumn].push({ ...photo, originalIndex });
    columnHeights[targetColumn] += height / width;
  });

  return columns;
}

export default function OverviewGrid({ photos, onPhotoClick }: OverviewGridProps) {
  const [columnCount, setColumnCount] = useState(5);
  const gridRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const updateColumnCount = () => setColumnCount(getColumnCount());

    updateColumnCount();
    window.addEventListener('resize', updateColumnCount);
    return () => window.removeEventListener('resize', updateColumnCount);
  }, []);

  useEffect(() => {
    const grid = gridRef.current;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!grid || prefersReducedMotion) return;

    let animationFrame: number | null = null;
    let currentTilt = 0;
    let targetTilt = 0;
    let lastScrollY = window.scrollY;
    let lastScrollAt = performance.now();

    const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

    const writeTilt = () => {
      grid.style.setProperty('--scroll-tilt', `${currentTilt.toFixed(3)}deg`);
    };

    const animateTilt = () => {
      if (performance.now() - lastScrollAt > 80) {
        targetTilt = 0;
      }

      currentTilt += (targetTilt - currentTilt) * 0.16;

      if (Math.abs(currentTilt) < 0.01 && targetTilt === 0) {
        currentTilt = 0;
        writeTilt();
        animationFrame = null;
        return;
      }

      writeTilt();
      animationFrame = window.requestAnimationFrame(animateTilt);
    };

    const startAnimation = () => {
      if (animationFrame === null) {
        animationFrame = window.requestAnimationFrame(animateTilt);
      }
    };

    const handleScroll = () => {
      const nextScrollY = window.scrollY;
      const scrollDelta = nextScrollY - lastScrollY;
      lastScrollY = nextScrollY;
      lastScrollAt = performance.now();

      if (Math.abs(scrollDelta) < 0.2) return;

      targetTilt = clamp(scrollDelta * -0.42, -8, 8);
      startAnimation();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }
      grid.style.removeProperty('--scroll-tilt');
    };
  }, []);

  const photoColumns = useMemo(() => distributePhotos(photos, columnCount), [photos, columnCount]);

  const handlePhotoClick = (event: React.MouseEvent<HTMLButtonElement>, index: number) => {
    const frame = event.currentTarget.querySelector('[data-photo-frame]');
    const rect = (frame instanceof HTMLElement ? frame : event.currentTarget).getBoundingClientRect();
    onPhotoClick(index, rect);
  };

  return (
    <div className={styles.container}>
      <div className={styles.grid} ref={gridRef}>
        {photoColumns.map((column, columnIndex) => (
          <div className={styles.column} key={columnIndex}>
            {column.map(photo => (
              <button
                key={`${photo.album}-${photo.index}`}
                type="button"
                className={styles.card}
                onClick={(event) => handlePhotoClick(event, photo.originalIndex)}
                aria-label={`查看${photo.info?.title || photo.albumTitle || '照片'}`}
              >
                <div className={styles.imageWrapper} data-photo-frame>
                  <Image
                    src={photo.thumbSrc}
                    alt={photo.info?.title || photo.albumTitle}
                    width={photo.width || 800}
                    height={photo.height || 600}
                    sizes="(max-width: 768px) calc(50vw - 20px), (max-width: 1199px) calc(33vw - 22px), calc(20vw - 20px)"
                    className={styles.image}
                  />
                  {photo.info?.title && (
                    <div className={styles.overlay}>
                      <div className={styles.overlayContent}>
                        <p className={styles.title}>{photo.info.title}</p>
                      </div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
