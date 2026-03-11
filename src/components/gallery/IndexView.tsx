'use client';

import { GalleryPhoto } from '@/lib/photos';
import styles from './IndexView.module.css';

interface IndexViewProps {
  photos: GalleryPhoto[];
  onPhotoClick: (index: number) => void;
}

export default function IndexView({ photos, onPhotoClick }: IndexViewProps) {
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerCellYear}>影集</div>
        <div className={styles.headerCellTitle}>照片</div>
        <div className={styles.headerCellCategory}>描述</div>
      </div>
      
      {/* List */}
      {photos.map((photo, index) => (
        <div
          key={`${photo.album}-${photo.index}`}
          className={styles.row}
          onClick={() => onPhotoClick(index)}
          style={{
            animation: `fadeInUp 0.4s ease-out ${index * 30}ms forwards`,
            opacity: 0,
          }}
        >
          <div className={styles.cellYear}>{photo.albumTitle}</div>
          <div className={styles.cellTitle}>{photo.info?.title || `照片 ${photo.index}`}</div>
          <div className={styles.cellCategory}>{photo.info?.desc || ''}</div>
        </div>
      ))}

      {/* Copyright Footer */}
      <footer className="copyright-footer">
        Copyright © 2026 辜云剑，All rights reserved.
      </footer>
    </div>
  );
}
