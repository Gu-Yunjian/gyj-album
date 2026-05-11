'use client';

import Image from 'next/image';
import Link from 'next/link';
import { DotsThree, ImageSquare } from '@phosphor-icons/react';
import styles from './CollectionCard.module.css';

interface CollectionCardProps {
  name: string;
  title: string;
  subtitle: string;
  cover: string;
  photos: string[];
  photoCount: number;
}

export default function CollectionCard({
  name,
  title,
  subtitle,
  cover,
  photos,
  photoCount,
}: CollectionCardProps) {
  const previewPhotos = photos.slice(0, 5);
  const extraCount = Math.max(photoCount - previewPhotos.length, 0);
  const stackPhoto = photos[previewPhotos.length];
  const albumHref = `/album/${encodeURIComponent(name)}`;
  const getPhotoHref = (photo: string) => {
    const stem = photo.replace(/\.[^/.]+$/, '');
    return `${albumHref}?photo=${encodeURIComponent(stem)}`;
  };

  // 禁止右键菜单
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <article
      className={styles.card}
      onContextMenu={handleContextMenu}
    >
      <Link href={albumHref} className={styles.cover} aria-label={`打开影集：${title}`}>
        {cover ? (
          <Image
            src={`/medium/${name}/${cover}`}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className={styles.image}
            loading="eager"
            draggable={false}
          />
        ) : (
          <div className={styles.emptyCover} aria-hidden="true" />
        )}
      </Link>

      <div className={styles.content}>
        <Link href={albumHref} className={styles.topline} aria-label={`打开影集：${title}`}>
          <div className={styles.text}>
            <h2 className={styles.title}>{title}</h2>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>

          <span className={styles.count} aria-label={`${photoCount} 张照片`}>
            {photoCount} 张照片
            <ImageSquare size={20} weight="regular" aria-hidden="true" />
          </span>
        </Link>

        {previewPhotos.length > 0 && (
          <div className={styles.previewStrip}>
            {previewPhotos.map((photo) => (
              <Link
                className={styles.preview}
                href={getPhotoHref(photo)}
                key={photo}
                style={{ backgroundImage: `url(/thumbnails/${name}/${photo})` }}
                aria-label={`从影集《${title}》打开这张照片`}
              />
            ))}

            {extraCount > 0 && stackPhoto && (
              <Link
                href={getPhotoHref(stackPhoto)}
                className={styles.morePreview}
                style={{ backgroundImage: `url(/thumbnails/${name}/${stackPhoto})` }}
                aria-label={`从影集《${title}》打开更多照片中的第一张`}
              >
                <DotsThree size={28} weight="bold" aria-hidden="true" />
              </Link>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
