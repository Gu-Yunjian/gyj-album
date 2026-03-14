'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { GalleryPhoto } from '@/lib/photos';
import styles from './OverviewGrid.module.css';

interface OverviewGridProps {
  photos: GalleryPhoto[];
  onPhotoClick: (index: number) => void;
}

export default function OverviewGrid({ photos, onPhotoClick }: OverviewGridProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {photos.map((photo, index) => (
          <div
            key={`${photo.album}-${photo.index}`}
            className={styles.card}
            onClick={() => onPhotoClick(index)}
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: `opacity 0.5s ease ${index * 30}ms, transform 0.5s ease ${index * 30}ms`,
            }}
          >
            <div className={styles.imageWrapper}>
              <Image
                src={photo.thumbSrc}
                alt={photo.info?.title || photo.albumTitle}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className={styles.image}
              />
              {/* Hover overlay - 仅当有标题时显示 */}
              {photo.info?.title && (
                <div className={styles.overlay}>
                  <div className={styles.overlayContent}>
                    <p className={styles.title}>{photo.info.title}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
