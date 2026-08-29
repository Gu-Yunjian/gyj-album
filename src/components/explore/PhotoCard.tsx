'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GalleryPhoto } from '@/lib/photos';
import styles from '../../app/explore/Explore.module.css';

interface PhotoCardProps {
  photo: GalleryPhoto;
  position: { x: number; y: number };
  rotation: number;
  zIndex: number;
  isMobile: boolean;
  onPositionChange: (pos: { x: number; y: number }) => void;
  onActivate: () => void;
}

const HIT_AREA_PADDING = 40;
const DESKTOP_IMAGE_AREA = 42000;
const DESKTOP_MAX_IMAGE_SIDE = 250;
const MOBILE_IMAGE_AREA = 32000;
const MOBILE_MAX_IMAGE_SIDE = 215;

function getDisplaySize(naturalWidth: number, naturalHeight: number, isMobile: boolean) {
  const targetArea = isMobile ? MOBILE_IMAGE_AREA : DESKTOP_IMAGE_AREA;
  const maxSide = isMobile ? MOBILE_MAX_IMAGE_SIDE : DESKTOP_MAX_IMAGE_SIDE;
  const areaScale = Math.sqrt(targetArea / (naturalWidth * naturalHeight));
  const sideScale = Math.min(1, maxSide / Math.max(naturalWidth * areaScale, naturalHeight * areaScale));
  const scale = areaScale * sideScale;

  return {
    width: naturalWidth * scale,
    height: naturalHeight * scale,
  };
}

export default function PhotoCard({
  photo,
  position,
  rotation,
  zIndex,
  isMobile,
  onPositionChange,
  onActivate,
}: PhotoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
  
  const isDraggingRef = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const dragStartMouse = useRef({ x: 0, y: 0 });

  // 加载图片获取尺寸
  useEffect(() => {
    const img = new Image();
    img.src = photo.thumbSrc;
    img.onload = () => {
      setImgSize(getDisplaySize(img.naturalWidth, img.naturalHeight, isMobile));
    };
  }, [photo.thumbSrc, isMobile]);

  const handleHoverStart = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') {
      setIsHovered(true);
    }
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    dragStartPos.current = { ...position };
    dragStartMouse.current = { x: e.clientX, y: e.clientY };
    onActivate();
    
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
  }, [position, onActivate]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    
    const deltaX = e.clientX - dragStartMouse.current.x;
    const deltaY = e.clientY - dragStartMouse.current.y;
    
    const newPos = {
      x: dragStartPos.current.x + deltaX,
      y: dragStartPos.current.y + deltaY,
    };
    
    onPositionChange(newPos);
  }, [onPositionChange]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const target = e.currentTarget;
    target.releasePointerCapture(e.pointerId);
    isDraggingRef.current = false;
  }, []);

  const handleHoverEnd = useCallback(() => {
    setIsHovered(false);
  }, []);

  if (imgSize.width === 0) return null;

  const cardWidth = imgSize.width + 24;
  const cardHeight = imgSize.height + 44;

  return (
    <div
      className={styles.hitArea}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        zIndex: zIndex,
        cursor: 'grab',
        width: cardWidth + HIT_AREA_PADDING * 2,
        height: cardHeight + HIT_AREA_PADDING * 2,
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerEnter={handleHoverStart}
      onPointerLeave={handleHoverEnd}
    >
      <motion.div
        className={styles.animatedCard}
        style={{
          width: cardWidth,
          height: cardHeight,
        }}
        initial={{ opacity: 0, scale: 0.8, rotate: rotation }}
        animate={{
          opacity: 1,
          scale: isHovered ? 1.045 : 1,
          rotate: rotation,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        <div
          className={styles.polaroidFrame}
          style={{
            padding: '12px 12px 32px 12px',
            background: 'white',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1), 0 10px 20px rgba(0,0,0,0.08)',
            borderRadius: 2,
          }}
        >
          <div
            style={{
              width: imgSize.width,
              height: imgSize.height,
              background: '#f5f5f5',
              overflow: 'hidden',
            }}
          >
            <img
              src={photo.thumbSrc}
              alt={photo.info?.title || ''}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
                pointerEvents: 'none',
              }}
              draggable={false}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
