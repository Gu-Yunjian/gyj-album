'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { GalleryPhoto } from '@/lib/photos';
import PhotoCard from './PhotoCard';
import styles from '../../app/explore/Explore.module.css';

interface ScatteredPhotosProps {
  photos: GalleryPhoto[];
  layoutKey: number;
}

type LayoutConfig = {
  photoCount: number;
  jitterX: number;
  jitterY: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  anchors: Array<{ x: number; y: number }>;
};

const DESKTOP_CONFIG: LayoutConfig = {
  photoCount: 20,
  jitterX: 0.07,
  jitterY: 0.055,
  minX: 0.02,
  maxX: 0.98,
  minY: -0.03,
  maxY: 0.94,
  anchors: [
    { x: 0.55, y: 0.45 },
    { x: 0.47, y: 0.52 },
    { x: 0.62, y: 0.54 },
    { x: 0.39, y: 0.60 },
    { x: 0.70, y: 0.62 },
    { x: 0.50, y: 0.68 },
    { x: 0.60, y: 0.72 },
    { x: 0.42, y: 0.75 },
    { x: 0.76, y: 0.76 },
    { x: 0.30, y: 0.48 },
    { x: 0.82, y: 0.42 },
    { x: 0.36, y: 0.34 },
    { x: 0.70, y: 0.31 },
    { x: 0.52, y: 0.22 },
    { x: 0.22, y: 0.20 },
    { x: 0.90, y: 0.18 },
    { x: 0.16, y: 0.66 },
    { x: 0.92, y: 0.66 },
    { x: 0.26, y: 0.88 },
    { x: 0.82, y: 0.90 },
  ],
};

const MOBILE_CONFIG: LayoutConfig = {
  photoCount: 15,
  jitterX: 0.09,
  jitterY: 0.055,
  minX: -0.14,
  maxX: 1.02,
  minY: 0.14,
  maxY: 0.92,
  anchors: [
    { x: 0.06, y: 0.18 },
    { x: 0.84, y: 0.30 },
    { x: 0.30, y: 0.44 },
    { x: 0.96, y: 0.58 },
    { x: -0.04, y: 0.68 },
    { x: 0.48, y: 0.76 },
    { x: 0.18, y: 0.84 },
    { x: 0.88, y: 0.90 },
    { x: 0.44, y: 0.22 },
    { x: 0.12, y: 0.36 },
    { x: 0.66, y: 0.50 },
    { x: 0.24, y: 0.62 },
    { x: 0.78, y: 0.72 },
    { x: 0.02, y: 0.80 },
    { x: 0.58, y: 0.88 },
  ],
};

const FOCUS_BACKDROP_Z_INDEX = 10000;

// 生成随机初始位置
function generatePositions(
  count: number,
  containerWidth: number,
  containerHeight: number,
  isMobile: boolean
): Array<{ x: number; y: number; rotation: number }> {
  const positions = [];
  
  for (let i = 0; i < count; i++) {
    
    const config = isMobile ? MOBILE_CONFIG : DESKTOP_CONFIG;
    const anchor = config.anchors[i % config.anchors.length];
    const offsetX = (Math.random() - 0.5) * config.jitterX;
    const offsetY = (Math.random() - 0.5) * config.jitterY;

    const x = containerWidth * clamp(anchor.x + offsetX, config.minX, config.maxX);
    const y = containerHeight * clamp(anchor.y + offsetY, config.minY, config.maxY);
    
    const rotation = -12 + Math.random() * 24;
    positions.push({ x, y, rotation });
  }
  
  return positions;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getInitialZIndex(position: { x: number; y: number }, containerWidth: number, containerHeight: number) {
  const centerX = containerWidth * 0.52;
  const centerY = containerHeight * 0.58;
  const normalizedX = (position.x - centerX) / containerWidth;
  const normalizedY = (position.y - centerY) / containerHeight;
  const distanceFromCenter = Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY);
  const centerLift = Math.round((1 - Math.min(distanceFromCenter / 0.58, 1)) * 28);
  const randomLift = Math.floor(Math.random() * 10);

  return 20 + centerLift + randomLift;
}

export default function ScatteredPhotos({ photos, layoutKey }: ScatteredPhotosProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [photoStates, setPhotoStates] = useState<Array<{
    position: { x: number; y: number };
    rotation: number;
    baseZIndex: number;
    zLevel: number;
  }>>([]);
  const [isReady, setIsReady] = useState(false);
  const clickCounterRef = useRef(0);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [focusPosition, setFocusPosition] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 检测移动端
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 获取照片数量
  const getPhotoCount = useCallback(() => {
    return isMobile ? MOBILE_CONFIG.photoCount : DESKTOP_CONFIG.photoCount;
  }, [isMobile]);

  const updateFocusPosition = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    setFocusPosition({
      x: window.innerWidth / 2 - rect.left,
      y: window.innerHeight / 2 - rect.top,
    });
  }, []);

  const openFocus = useCallback((index: number) => {
    updateFocusPosition();
    setFocusedIndex(index);
  }, [updateFocusPosition]);

  const closeFocus = useCallback(() => {
    setFocusedIndex(null);
    setFocusPosition(null);
  }, []);

  useEffect(() => {
    if (focusedIndex === null) return;

    updateFocusPosition();
    window.addEventListener('resize', updateFocusPosition);
    return () => window.removeEventListener('resize', updateFocusPosition);
  }, [focusedIndex, updateFocusPosition]);

  // 初始化位置
  useEffect(() => {
    const init = () => {
      const container = document.getElementById('photos-area');
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const size = { width: rect.width, height: rect.height };
      
      if (size.width > 0 && size.height > 0) {
        const photoCount = getPhotoCount();
        const displayPhotos = photos.slice(0, photoCount);
        const positions = generatePositions(displayPhotos.length, size.width, size.height, isMobile);
        setPhotoStates(positions.map(p => ({
          position: { x: p.x, y: p.y },
          rotation: p.rotation,
          baseZIndex: getInitialZIndex({ x: p.x, y: p.y }, size.width, size.height),
          zLevel: 0 
        })));
        setIsReady(true);
        clickCounterRef.current = 0;
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
    const newCounter = clickCounterRef.current + 1;
    clickCounterRef.current = newCounter;

    setPhotoStates(photoStates => {
      const next = [...photoStates];
      next[index] = { ...next[index], zLevel: newCounter };
      return next;
    });
  }, []);

  const updateRotation = useCallback((index: number, rotation: number) => {
    setPhotoStates(prev => {
      const next = [...prev];
      if (!next[index]) return prev;
      next[index] = { ...next[index], rotation };
      return next;
    });
  }, []);

  // 计算实际 z-index
  const getZIndex = (baseZIndex: number, zLevel: number) => {
    return Math.min(baseZIndex + zLevel * 100, FOCUS_BACKDROP_Z_INDEX - 1);
  };

  // 获取当前显示的照片数量
  const displayCount = getPhotoCount();
  const displayPhotos = photos.slice(0, displayCount);

  if (!isReady) {
    return <div id="photos-area" className={styles.photosContainer} />;
  }

  return (
    <div ref={containerRef} id="photos-area" className={styles.photosContainer}>
      <AnimatePresence>
        {focusedIndex !== null && (
          <motion.button
            type="button"
            className={styles.focusBackdrop}
            aria-label="关闭聚焦"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            onClick={closeFocus}
          />
        )}
      </AnimatePresence>
      {displayPhotos.map((photo, index) => {
        const state = photoStates[index];
        if (!state) return null;

        return (
          <PhotoCard
            key={`${photo.album}-${photo.index}`}
            photo={photo}
            position={state.position}
            rotation={state.rotation}
            zIndex={getZIndex(state.baseZIndex, state.zLevel)}
            isMobile={isMobile}
            onPositionChange={(pos) => updatePosition(index, pos)}
            onRotationChange={(rotation) => updateRotation(index, rotation)}
            onActivate={() => activatePhoto(index)}
            isFocused={focusedIndex === index}
            focusPosition={focusPosition}
            onFocus={() => openFocus(index)}
            onClose={closeFocus}
          />
        );
      })}
    </div>
  );
}
