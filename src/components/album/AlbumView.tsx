'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { CaretLeft, CaretRight, SpeakerHigh, SpeakerSlash, X, Moon, Sun } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { AlbumInfo } from '@/lib/photos';

import styles from './AlbumView.module.css';

interface ExifInfo {
  aperture?: string;
  shutterSpeed?: string;
  iso?: number;
}

interface AlbumViewProps {
  album: AlbumInfo;
}

export default function AlbumView({ album }: AlbumViewProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [exifData, setExifData] = useState<ExifInfo | null>(null);

  const currentPhoto = album.photos[currentIndex];
  const currentPhotoName = currentPhoto.replace(/\.[^/.]+$/, '');
  const currentInfo = album.photoInfos[currentPhotoName];

  // 加载 EXIF 信息
  useEffect(() => {
    async function loadExif() {
      try {
        const res = await fetch(`/api/photos/${encodeURIComponent(album.name)}/${encodeURIComponent(currentPhoto)}`);
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
  }, [album.name, currentPhoto]);

  // 格式化 EXIF 显示 - 只显示光圈、快门速度、ISO
  const formatExif = () => {
    if (!exifData) return null;
    const parts: string[] = [];

    if (exifData.aperture) parts.push(exifData.aperture);
    if (exifData.shutterSpeed) parts.push(exifData.shutterSpeed);
    if (exifData.iso) parts.push(`ISO ${exifData.iso}`);

    return parts.length > 0 ? parts.join(' · ') : null;
  };

  // 禁止右键菜单
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  // 禁止图片拖拽
  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
  };


  // 导航
  const goToPrev = useCallback(() => {
    setCurrentIndex(i => Math.max(0, i - 1));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex(i => Math.min(album.photos.length - 1, i + 1));
  }, [album.photos.length]);

// BGM 处理
  const toggleBgm = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  // 切换夜间模式
  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(!isDarkMode);
  }, [isDarkMode]);

  return (
    <div className={`${styles.container} ${isDarkMode ? styles.dark : ''}`}>
      {/* 左侧控制按钮组 */}
      <div className={styles.controls}>
        {/* 退出按钮 */}
        <button
          className={styles.controlButton}
          onClick={() => router.push('/collections')}
          aria-label="关闭"
        >
          <X size={20} />
        </button>

        {/* 夜间模式切换 */}
        <button
          className={styles.controlButton}
          onClick={toggleDarkMode}
          aria-label={isDarkMode ? '切换日间模式' : '切换夜间模式'}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* 左侧 - 主展示区 */}
      <div className={styles.main}>
        <div
          className={styles.imageContainer}
          onContextMenu={handleContextMenu}
        >
          <Image
            src={`/photos/${album.name}/${currentPhoto}`}
            alt={currentInfo?.title || album.title}
            fill
            sizes="(max-width: 768px) 100vw, 75vw"
            className={styles.image}
            priority
            draggable={false}
            onDragStart={handleDragStart}
          />
        </div>

        {/* 导航箭头 */}
        {album.photos.length > 1 && (
          <>
            {currentIndex > 0 && (
              <button className={`${styles.nav} ${styles.navPrev}`} onClick={goToPrev}>
                <CaretLeft size={32} />
              </button>
            )}
            {currentIndex < album.photos.length - 1 && (
              <button className={`${styles.nav} ${styles.navNext}`} onClick={goToNext}>
                <CaretRight size={32} />
              </button>
            )}
          </>
        )}
      </div>

      {/* 右侧 - 信息区 */}
      <aside className={styles.sidebar}>
        <header className={styles.header}>
          <h1 className={styles.title}>{album.title}</h1>
          <p className={styles.subtitle}>{album.subtitle}</p>
        </header>

        <div className={styles.info}>
          {currentInfo && (
            <>
              <h2 className={styles.photoTitle}>{currentInfo.title}</h2>
              {currentInfo.desc && (
                <p className={styles.photoDesc}>{currentInfo.desc}</p>
              )}
            </>
          )}
          {/* EXIF 信息 */}
          {formatExif() && (
            <p className={styles.photoExif}>{formatExif()}</p>
          )}
        </div>

        {/* BGM 控制 - 仅当有音乐文件时显示 */}
        {album.hasBgm && (
          <div className={styles.bgm}>
            <button className={styles.bgmButton} onClick={toggleBgm}>
              {isPlaying ? <SpeakerHigh size={20} /> : <SpeakerSlash size={20} />}
              <span>{isPlaying ? '播放中' : '已静音'}</span>
            </button>
          </div>
        )}

        {/* 底部区域 - 缩略图和计数器 */}
        <div className={styles.bottom}>
          {/* 缩略图导航 */}
          {album.photos.length > 1 && (
            <div className={styles.thumbnails}>
              {album.photos.map((photo, index) => (
                <button
                  key={photo}
                  className={`${styles.thumbnail} ${index === currentIndex ? styles.thumbnailActive : ''}`}
                  onClick={() => setCurrentIndex(index)}
                  onContextMenu={handleContextMenu}
                >
                  <Image
                    src={`/photos/${album.name}/${photo}`}
                    alt=""
                    width={60}
                    height={60}
                    className={styles.thumbnailImage}
                    draggable={false}
                    onDragStart={handleDragStart}
                  />
                </button>
              ))}
            </div>
          )}

          <div className={styles.counter}>
            {currentIndex + 1} / {album.photos.length}
          </div>
        </div>
      </aside>


    </div>
  );
}
