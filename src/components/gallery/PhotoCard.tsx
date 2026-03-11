'use client';

import { useState } from 'react';
import Image from 'next/image';
import styles from './PhotoCard.module.css';

interface PhotoCardProps {
  src: string;
  alt?: string;
  onClick?: () => void;
}

export default function PhotoCard({
  src,
  alt = '',
  onClick,
}: PhotoCardProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  // 禁止右键菜单
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div
      className={styles.card}
      onClick={onClick}
      onContextMenu={handleContextMenu}
    >
      <div className={styles.imageWrapper}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 768px) 180px, 240px"
          className={`${styles.image} ${isLoaded ? styles.loaded : ''}`}
          onLoad={() => setIsLoaded(true)}
          priority={false}
          draggable={false}
          unoptimized
        />
      </div>
      {/* 悬停遮罩 - 仅当有标题时显示 */}
      {alt && (
        <div className={styles.overlay}>
          <span className={styles.overlayText}>{alt}</span>
        </div>
      )}
    </div>
  );
}
