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
  isFocused: boolean;
  focusPosition: { x: number; y: number } | null;
  onFocus: () => void;
  onClose: () => void;
}

const HIT_AREA_PADDING = 8;
const HOVER_SCALE = 1.045;
const FOCUSED_Z_INDEX = 2101;
const CLICK_DRAG_THRESHOLD = 6;
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
  isFocused,
  focusPosition,
  onFocus,
  onClose,
}: PhotoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
  const [isReturning, setIsReturning] = useState(false);

  const isDraggingRef = useRef(false);
  const hasMovedRef = useRef(false);
  const wasFocusedRef = useRef(false);
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

  useEffect(() => {
    if (wasFocusedRef.current && !isFocused) {
      setIsReturning(true);
    }
    wasFocusedRef.current = isFocused;
  }, [isFocused]);

  const handleHoverStart = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') {
      setIsHovered(true);
    }
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    if (isFocused) return;

    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartPos.current = { ...position };
    dragStartMouse.current = { x: e.clientX, y: e.clientY };
    onActivate();
    
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
  }, [isFocused, position, onActivate]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    
    const deltaX = e.clientX - dragStartMouse.current.x;
    const deltaY = e.clientY - dragStartMouse.current.y;

    if (!hasMovedRef.current && Math.hypot(deltaX, deltaY) < CLICK_DRAG_THRESHOLD) {
      return;
    }

    hasMovedRef.current = true;
    
    const newPos = {
      x: dragStartPos.current.x + deltaX,
      y: dragStartPos.current.y + deltaY,
    };
    
    onPositionChange(newPos);
  }, [onPositionChange]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const target = e.currentTarget;
    if (target.hasPointerCapture(e.pointerId)) {
      target.releasePointerCapture(e.pointerId);
    }
    isDraggingRef.current = false;
  }, []);

  const handleClick = useCallback(() => {
    if (hasMovedRef.current) {
      hasMovedRef.current = false;
      return;
    }

    if (isFocused) {
      onClose();
    } else {
      onFocus();
    }
  }, [isFocused, onClose, onFocus]);

  const handleHoverEnd = useCallback(() => {
    setIsHovered(false);
  }, []);

  if (imgSize.width === 0) return null;

  const cardWidth = imgSize.width + 24;
  const cardHeight = imgSize.height + 44;
  const rotationRadians = Math.abs(rotation) * Math.PI / 180;
  const maxTransformedWidth = HOVER_SCALE * (
    cardWidth * Math.cos(rotationRadians) + cardHeight * Math.sin(rotationRadians)
  );
  const maxTransformedHeight = HOVER_SCALE * (
    cardWidth * Math.sin(rotationRadians) + cardHeight * Math.cos(rotationRadians)
  );
  const hitWidth = Math.max(cardWidth, maxTransformedWidth) + HIT_AREA_PADDING * 2;
  const hitHeight = Math.max(cardHeight, maxTransformedHeight) + HIT_AREA_PADDING * 2;

  return (
    <motion.div
      className={styles.hitArea}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        zIndex: isFocused || isReturning ? FOCUSED_Z_INDEX : zIndex,
        cursor: isFocused ? 'zoom-out' : 'grab',
        width: hitWidth,
        height: hitHeight,
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      animate={{
        left: isFocused && focusPosition ? focusPosition.x : position.x,
        top: isFocused && focusPosition ? focusPosition.y : position.y,
      }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
      onAnimationComplete={() => {
        if (isReturning) setIsReturning(false);
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleClick}
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
          scale: isFocused ? 1 : isHovered ? HOVER_SCALE : 1,
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
    </motion.div>
  );
}
