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

const MAX_TILT_DEGREES = 9;
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
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
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

  const updateTilt = useCallback((e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const relativeX = (e.clientX - rect.left) / rect.width - 0.5;
    const relativeY = (e.clientY - rect.top) / rect.height - 0.5;

    setTilt({
      rotateX: -relativeY * MAX_TILT_DEGREES * 2,
      rotateY: relativeX * MAX_TILT_DEGREES * 2,
    });
  }, []);

  const resetTilt = useCallback(() => {
    setTilt({ rotateX: 0, rotateY: 0 });
  }, []);

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
    resetTilt();
    onActivate();
    
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
  }, [position, resetTilt, onActivate]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) {
      if (isHovered && e.pointerType === 'mouse') {
        updateTilt(e);
      }
      return;
    }
    
    const deltaX = e.clientX - dragStartMouse.current.x;
    const deltaY = e.clientY - dragStartMouse.current.y;
    
    const newPos = {
      x: dragStartPos.current.x + deltaX,
      y: dragStartPos.current.y + deltaY,
    };
    
    onPositionChange(newPos);
  }, [isHovered, updateTilt, onPositionChange]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const target = e.currentTarget;
    target.releasePointerCapture(e.pointerId);
    isDraggingRef.current = false;
  }, []);

  const handleHoverEnd = useCallback(() => {
    setIsHovered(false);
    resetTilt();
  }, [resetTilt]);

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
          transformPerspective: 700,
          transformStyle: 'preserve-3d',
        }}
        initial={{ opacity: 0, scale: 0.8, rotate: rotation, rotateX: 0, rotateY: 0 }}
        animate={{
          opacity: 1,
          scale: isHovered ? 1.045 : 1,
          rotate: rotation,
          rotateX: isHovered ? tilt.rotateX : 0,
          rotateY: isHovered ? tilt.rotateY : 0,
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
