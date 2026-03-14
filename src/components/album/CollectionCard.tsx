'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './CollectionCard.module.css';

interface CollectionCardProps {
  name: string;
  title: string;
  subtitle: string;
  cover: string;
  photoCount: number;
}

export default function CollectionCard({
  name,
  title,
  subtitle,
  cover,
  photoCount,
}: CollectionCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // 禁止右键菜单
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <Link
      href={`/album/${encodeURIComponent(name)}`}
      className={styles.card}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onContextMenu={handleContextMenu}
    >
      <div className={styles.imageWrapper}>
        <Image
          src={`/medium/${name}/${cover}`}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className={styles.image}
          draggable={false}
        />
      </div>

      {/* 右下角悬停信息 */}
      <div className={`${styles.info} ${isHovered ? styles.infoVisible : ''}`}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.count}>{photoCount} 张照片</p>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
    </Link>
  );
}
