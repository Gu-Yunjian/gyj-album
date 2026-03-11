'use client';

import { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle, useMemo } from 'react';
import { GalleryPhoto } from '@/lib/photos';
import PhotoCard from './PhotoCard';
import CenterProfile from './CenterProfile';
import styles from './GalleryCanvas.module.css';

interface GalleryCanvasProps {
  photos: GalleryPhoto[];
  profile: {
    name?: string;
    school?: string;
    slogan?: string;
  };
  onPhotoClick?: (photo: GalleryPhoto) => void;
}

interface Position {
  x: number;
  y: number;
}

interface LayoutItem {
  isCenter: boolean;
  photo: GalleryPhoto | null;
  x: number;
  y: number;
  gridX: number;
  gridY: number;
  layer: number;
}

export interface GalleryCanvasRef {
  resetPosition: () => void;
}

const GalleryCanvas = forwardRef<GalleryCanvasRef, GalleryCanvasProps>(function GalleryCanvas({
  photos,
  profile,
  onPhotoClick,
}, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [startPos, setStartPos] = useState<Position>({ x: 0, y: 0 });
  const [velocity, setVelocity] = useState<Position>({ x: 0, y: 0 });
  const [viewportSize, setViewportSize] = useState({ width: 1920, height: 1080 });
  const animationRef = useRef<number | undefined>(undefined);
  const lastMousePos = useRef<Position>({ x: 0, y: 0 });

  // 获取CSS变量定义的间距参数
  const getLayoutParams = useCallback(() => {
    if (typeof window === 'undefined') {
      return { cellSize: 280, gap: 40 };
    }
    const root = getComputedStyle(document.documentElement);
    return {
      cellSize: parseFloat(root.getPropertyValue('--gallery-cell-size')) || 280,
      gap: parseFloat(root.getPropertyValue('--gallery-cell-gap')) || 40,
    };
  }, []);

  // 计算同心方格布局
  const calculateConcentricGridLayout = useCallback((): LayoutItem[] => {
    const { cellSize, gap } = getLayoutParams();
    const items: LayoutItem[] = [];
    const spacing = cellSize + gap;

    // 中心格子 - 个人资料 (0, 0)
    items.push({
      isCenter: true,
      photo: null,
      x: 0,
      y: 0,
      gridX: 0,
      gridY: 0,
      layer: 0,
    });

    let photoIndex = 0;
    let layer = 1;

    // 逐层向外扩展，直到用完所有照片
    while (photoIndex < photos.length) {
      // 当前层的边长 (以格子数计)
      const sideLength = layer * 2 + 1; // 3, 5, 7, 9...
      
      // 遍历当前层的四条边
      // 顶边 (从左到右，不包括左上角，包括右上角)
      for (let i = 0; i < sideLength - 1 && photoIndex < photos.length; i++) {
        const gridX = -layer + i;
        const gridY = -layer;
        items.push({
          isCenter: false,
          photo: photos[photoIndex++],
          x: gridX * spacing,
          y: gridY * spacing,
          gridX,
          gridY,
          layer,
        });
      }

      // 右边 (从上到下，不包括右上角，包括右下角)
      for (let i = 0; i < sideLength - 1 && photoIndex < photos.length; i++) {
        const gridX = layer;
        const gridY = -layer + i;
        items.push({
          isCenter: false,
          photo: photos[photoIndex++],
          x: gridX * spacing,
          y: gridY * spacing,
          gridX,
          gridY,
          layer,
        });
      }

      // 底边 (从右到左，不包括右下角，包括左下角)
      for (let i = 0; i < sideLength - 1 && photoIndex < photos.length; i++) {
        const gridX = layer - i;
        const gridY = layer;
        items.push({
          isCenter: false,
          photo: photos[photoIndex++],
          x: gridX * spacing,
          y: gridY * spacing,
          gridX,
          gridY,
          layer,
        });
      }

      // 左边 (从下到上，不包括左下角，不包括左上角因为下个循环会处理)
      for (let i = 0; i < sideLength - 1 && photoIndex < photos.length; i++) {
        const gridX = -layer;
        const gridY = layer - i;
        items.push({
          isCenter: false,
          photo: photos[photoIndex++],
          x: gridX * spacing,
          y: gridY * spacing,
          gridX,
          gridY,
          layer,
        });
      }

      layer++;
    }

    return items;
  }, [photos, getLayoutParams]);

  const layout = useMemo(() => calculateConcentricGridLayout(), [calculateConcentricGridLayout]);

  // 虚拟化：只渲染视口内的项目
  const visibleItems = useMemo(() => {
    const { cellSize } = getLayoutParams();
    const buffer = cellSize * 1.5; // 多渲染一些作为缓冲
    const halfWidth = viewportSize.width / 2 + buffer;
    const halfHeight = viewportSize.height / 2 + buffer;

    return layout.filter(item => {
      const screenX = item.x + position.x;
      const screenY = item.y + position.y;
      return (
        screenX > -halfWidth &&
        screenX < halfWidth &&
        screenY > -halfHeight &&
        screenY < halfHeight
      );
    });
  }, [layout, position, viewportSize, getLayoutParams]);

  // 更新视口大小
  useEffect(() => {
    const updateSize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // 拖动开始
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setHasDragged(false);
    setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
    setVelocity({ x: 0, y: 0 });
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, [position]);

  // 拖动中
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;

    const dx = Math.abs(e.clientX - lastMousePos.current.x);
    const dy = Math.abs(e.clientY - lastMousePos.current.y);
    if (dx > 5 || dy > 5) {
      setHasDragged(true);
    }

    const newX = e.clientX - startPos.x;
    const newY = e.clientY - startPos.y;

    setVelocity({
      x: newX - position.x,
      y: newY - position.y,
    });

    setPosition({ x: newX, y: newY });
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, [isDragging, startPos, position]);

  // 拖动结束 - 惯性滑动
  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const friction = 0.95;
    let vx = velocity.x;
    let vy = velocity.y;
    let currentX = position.x;
    let currentY = position.y;

    const animate = () => {
      vx *= friction;
      vy *= friction;

      if (Math.abs(vx) < 0.1 && Math.abs(vy) < 0.1) {
        return;
      }

      currentX += vx;
      currentY += vy;
      setPosition({ x: currentX, y: currentY });
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [isDragging, velocity, position]);

  // 触摸支持
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setStartPos({ x: touch.clientX - position.x, y: touch.clientY - position.y });
    setVelocity({ x: 0, y: 0 });
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, [position]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const newX = touch.clientX - startPos.x;
    const newY = touch.clientY - startPos.y;

    setVelocity({
      x: newX - position.x,
      y: newY - position.y,
    });

    setPosition({ x: newX, y: newY });
  }, [isDragging, startPos, position]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const friction = 0.95;
    let vx = velocity.x;
    let vy = velocity.y;
    let currentX = position.x;
    let currentY = position.y;

    const animate = () => {
      vx *= friction;
      vy *= friction;

      if (Math.abs(vx) < 0.1 && Math.abs(vy) < 0.1) {
        return;
      }

      currentX += vx;
      currentY += vy;
      setPosition({ x: currentX, y: currentY });
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [isDragging, velocity, position]);

  // 暴露重置位置的方法
  const resetPosition = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const startX = position.x;
    const startY = position.y;
    const duration = 500;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      const currentX = startX * (1 - eased);
      const currentY = startY * (1 - eased);

      setPosition({ x: currentX, y: currentY });

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [position.x, position.y]);

  useImperativeHandle(ref, () => ({
    resetPosition,
  }), [resetPosition]);

  // 清理动画
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // 滚轮移动支持
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setPosition(prev => ({
      x: prev.x - e.deltaX * 0.5,
      y: prev.y - e.deltaY * 0.5,
    }));
  }, []);

  return (
    <div
      ref={containerRef}
      className={styles.canvas}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <div
        className={styles.content}
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
        }}
      >
        {visibleItems.map((item) => (
          <div
            key={item.isCenter ? 'center-profile' : `${item.photo?.album}-${item.photo?.index}`}
            className={`${styles.item} ${item.isCenter ? styles.centerItem : ''}`}
            style={{
              left: `calc(50% + ${item.x}px)`,
              top: `calc(50% + ${item.y}px)`,
              transform: 'translate(-50%, -50%)',
              zIndex: item.isCenter ? 100 : 10 - item.layer,
            }}
          >
            {item.isCenter ? (
              <CenterProfile profile={profile} />
            ) : item.photo && (
              <PhotoCard
                src={item.photo.src}
                alt={item.photo.info?.title || ''}
                onClick={() => {
                  if (!hasDragged && onPhotoClick) {
                    onPhotoClick(item.photo!);
                  }
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* 提示 */}
      <div className={styles.hint}>
        拖动浏览 · 任意方向探索
      </div>
    </div>
  );
});

export default GalleryCanvas;
