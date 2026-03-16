'use client';

import { useState, useEffect, useCallback } from 'react';
import { GalleryPhoto } from '@/lib/photos';
import PhotoCard from './PhotoCard';
import styles from '../../app/explore/Explore.module.css';

interface ScatteredPhotosProps {
  photos: GalleryPhoto[];
  layoutKey: number;
}

// PC端配置
const PC_CONFIG = {
  photoCount: 15,
  startX: 0.1,      // 从10%开始（整个右侧区域）
  endX: 0.8,         // 到80%（页面边缘）
  startY: 0,      // 从0%开始
  endY: 0.85,        // 到85%（接近底部）
  concentration: 0.95, // 集中度：使用95%区域，更充分利用空间
};

// 移动端配置
const MOBILE_CONFIG = {
  photoCount: 6,
  topRegion: { startY: 0, endY: 0 },
  bottomRegion: { startY: 0.75, endY: 0.80 },
  concentration: 0.7, // 集中度
};

// 生成随机初始位置
function generatePositions(
  count: number,
  containerWidth: number,
  containerHeight: number,
  isMobile: boolean
): Array<{ x: number; y: number; rotation: number }> {
  const positions = [];
  
  for (let i = 0; i < count; i++) {
    let x: number, y: number;
    
    if (isMobile) {
      // 移动端：上下区域分布，应用集中度
      const isTop = i % 2 === 0;
      const config = MOBILE_CONFIG;
      
      // 计算集中后的区域
      const region = isTop ? config.topRegion : config.bottomRegion;
      const regionHeight = region.endY - region.startY;
      const concentratedHeight = regionHeight * config.concentration;
      const padding = (regionHeight - concentratedHeight) / 2;
      
      const actualStartY = region.startY + padding;
      const actualEndY = region.endY - padding;
      
      x = containerWidth * 0.1 + Math.random() * (containerWidth * 0.8);
      y = containerHeight * (actualStartY + Math.random() * (actualEndY - actualStartY));
    } else {
      // PC端：应用集中度
      const config = PC_CONFIG;
      
      // 计算可用范围
      const rangeX = config.endX - config.startX;
      const rangeY = config.endY - config.startY;
      
      // 应用集中度缩小范围
      const concentratedRangeX = rangeX * config.concentration;
      const concentratedRangeY = rangeY * config.concentration;
      
      // 计算padding使分布居中
      const paddingX = (rangeX - concentratedRangeX) / 2;
      const paddingY = (rangeY - concentratedRangeY) / 2;
      
      const actualStartX = config.startX + paddingX;
      const actualEndX = config.endX - paddingX;
      const actualStartY = config.startY + paddingY;
      const actualEndY = config.endY - paddingY;
      
      x = containerWidth * (actualStartX + Math.random() * (actualEndX - actualStartX));
      y = containerHeight * (actualStartY + Math.random() * (actualEndY - actualStartY));
    }
    
    const rotation = -12 + Math.random() * 24;
    positions.push({ x, y, rotation });
  }
  
  return positions;
}

export default function ScatteredPhotos({ photos, layoutKey }: ScatteredPhotosProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [photoStates, setPhotoStates] = useState<Array<{
    position: { x: number; y: number };
    rotation: number;
    zLevel: number;
  }>>([]);
  const [isReady, setIsReady] = useState(false);
  const [clickCounter, setClickCounter] = useState(0);

  // 检测移动端
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 获取照片数量
  const getPhotoCount = useCallback(() => {
    return isMobile ? MOBILE_CONFIG.photoCount : PC_CONFIG.photoCount;
  }, [isMobile]);

  // 初始化位置
  useEffect(() => {
    const init = () => {
      const container = document.getElementById('photos-area');
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const size = { width: rect.width, height: rect.height };
      
      if (size.width > 0 && size.height > 0) {
        setContainerSize(size);
        const photoCount = getPhotoCount();
        const displayPhotos = photos.slice(0, photoCount);
        const positions = generatePositions(displayPhotos.length, size.width, size.height, isMobile);
        setPhotoStates(positions.map(p => ({ 
          position: { x: p.x, y: p.y }, 
          rotation: p.rotation,
          zLevel: 0 
        })));
        setIsReady(true);
        setClickCounter(0);
      }
    };
    
    requestAnimationFrame(init);
    const timer = setTimeout(init, 100);
    
    return () => clearTimeout(timer);
  }, [photos, isMobile, layoutKey, getPhotoCount]);

  // 更新单个照片位置
  const updatePosition = useCallback((index: number, pos: { x: number; y: number }) => {
    setPhotoStates(prev => {
      const next = [...prev];
      next[index] = { ...next[index], position: pos };
      return next;
    });
  }, []);

  // 激活照片（提升层级）
  const activatePhoto = useCallback((index: number) => {
    setClickCounter(prev => {
      const newCounter = prev + 1;
      
      setPhotoStates(photoStates => {
        const next = [...photoStates];
        next[index] = { ...next[index], zLevel: newCounter };
        return next;
      });
      
      return newCounter;
    });
  }, []);

  // 计算实际 z-index
  const getZIndex = (baseIndex: number, zLevel: number) => {
    return 10 + baseIndex + zLevel * 10;
  };

  // 获取当前显示的照片数量
  const displayCount = getPhotoCount();
  const displayPhotos = photos.slice(0, displayCount);

  if (!isReady) {
    return <div id="photos-area" className={styles.photosContainer} />;
  }

  return (
    <div id="photos-area" className={styles.photosContainer}>
      {displayPhotos.map((photo, index) => {
        const state = photoStates[index];
        if (!state) return null;

        return (
          <PhotoCard
            key={`${photo.album}-${photo.index}`}
            photo={photo}
            position={state.position}
            rotation={state.rotation}
            zIndex={getZIndex(index, state.zLevel)}
            onPositionChange={(pos) => updatePosition(index, pos)}
            onActivate={() => activatePhoto(index)}
          />
        );
      })}
    </div>
  );
}
