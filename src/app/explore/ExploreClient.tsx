'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GalleryPhoto } from '@/lib/photos';
import Navigation from '@/components/layout/Navigation';
import ScatteredPhotos from '@/components/explore/ScatteredPhotos';
import styles from './Explore.module.css';

interface ExploreClientProps {
  allPhotos: GalleryPhoto[];
}

const PHOTO_POOL_SIZE = 20;

// 随机选择 n 张照片
function getRandomPhotos(photos: GalleryPhoto[], count: number): GalleryPhoto[] {
  const shuffled = [...photos].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, photos.length));
}

export default function ExploreClient({ allPhotos }: ExploreClientProps) {
  const router = useRouter();
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [layoutKey, setLayoutKey] = useState(0);

  // 初始化随机选择足够覆盖桌面端展示数量的照片
  useEffect(() => {
    if (allPhotos.length > 0) {
      setPhotos(getRandomPhotos(allPhotos, PHOTO_POOL_SIZE));
    }
  }, [allPhotos]);

  // 刷新布局
  const handleRefresh = useCallback(() => {
    setPhotos(getRandomPhotos(allPhotos, PHOTO_POOL_SIZE));
    setLayoutKey(prev => prev + 1);
  }, [allPhotos]);

  return (
    <main className={styles.container}>
      <Navigation />
      
      <div className={styles.content}>
        {/* 左侧文字区域 */}
        <div className={styles.textSection}>
          <h1 className={styles.title}>WELCOME!</h1>
          <p className={styles.subtitle}>欢迎来到我的线上展厅:D</p>
          <div className={styles.buttons}>
            <button 
              className={styles.button}
              onClick={() => router.push('/gallery')}
            >
              随便看看
            </button>
            <button 
              className={styles.button}
              onClick={() => router.push('/collections')}
            >
              选择影集
            </button>
          </div>
        </div>

        {/* 右侧照片区域 */}
        <div className={styles.photosSection}>
          <ScatteredPhotos 
            photos={photos}
            layoutKey={layoutKey}
          />
        </div>
      </div>

      {/* 刷新按钮 */}
      <button 
        className={styles.refreshBtn}
        onClick={handleRefresh}
        aria-label="刷新布局"
      >
        <svg 
          viewBox="0 0 162.19 149.97" 
          className={styles.refreshIcon}
        >
          <path 
            className={styles.refreshPath}
            d="M156.5,70.33h-6.69A75,75,0,1,0,75,150h.09a5.68,5.68,0,0,0,0-11.35H75a63.6,63.6,0,1,1,63.42-68.3h-8.55a5.67,5.67,0,0,0-4,9.68l13.32,13.32a5.65,5.65,0,0,0,8,0L160.53,80a5.66,5.66,0,0,0-4-9.67Z"
          />
        </svg>
      </button>
    </main>
  );
}
