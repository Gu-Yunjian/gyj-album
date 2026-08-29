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

const HIT_AREA_PADDING = 4;
const HOVER_SCALE = 1.045;
const FOCUSED_Z_INDEX = 10001;
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

function getRotatedRectClipPath(width: number, height: number, rotation: number, scale: number) {
  const halfWidth = width * scale / 2;
  const halfHeight = height * scale / 2;
  const radians = rotation * Math.PI / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const corners = [
    [-halfWidth, -halfHeight],
    [halfWidth, -halfHeight],
    [halfWidth, halfHeight],
    [-halfWidth, halfHeight],
  ].map(([x, y]) => [x * cos - y * sin, x * sin + y * cos]);
  const minX = Math.min(...corners.map(([x]) => x));
  const maxX = Math.max(...corners.map(([x]) => x));
  const minY = Math.min(...corners.map(([, y]) => y));
  const maxY = Math.max(...corners.map(([, y]) => y));

  return `polygon(${corners.map(([x, y]) => `${((x - minX) / (maxX - minX)) * 100}% ${((y - minY) / (maxY - minY)) * 100}%`).join(', ')})`;
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
  const [isDragging, setIsDragging] = useState(false);

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
    setIsDragging(true);
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
    setIsDragging(false);
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
  const visualScale = isFocused || isDragging ? 1 : isHovered ? HOVER_SCALE : 1;
  const visualRotation = isFocused || isDragging ? 0 : rotation;
  const hitCardWidth = cardWidth + HIT_AREA_PADDING * 2;
  const hitCardHeight = cardHeight + HIT_AREA_PADDING * 2;
  const rotationRadians = Math.abs(visualRotation) * Math.PI / 180;
  const scaledHitWidth = hitCardWidth * visualScale;
  const scaledHitHeight = hitCardHeight * visualScale;
  const hitWidth = scaledHitWidth * Math.cos(rotationRadians) + scaledHitHeight * Math.sin(rotationRadians);
  const hitHeight = scaledHitWidth * Math.sin(rotationRadians) + scaledHitHeight * Math.cos(rotationRadians);
  const hitClipPath = getRotatedRectClipPath(hitCardWidth, hitCardHeight, visualRotation, visualScale);

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
        clipPath: hitClipPath,
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
      onPointerCancel={handlePointerUp}
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
          scale: visualScale,
          rotate: visualRotation,
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
