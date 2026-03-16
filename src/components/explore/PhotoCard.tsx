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
  onPositionChange: (pos: { x: number; y: number }) => void;
  onActivate: () => void;
}

export default function PhotoCard({
  photo,
  position,
  rotation,
  zIndex,
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
      const maxWidth = 180;
      const scale = img.naturalWidth > maxWidth ? maxWidth / img.naturalWidth : 1;
      setImgSize({
        width: img.naturalWidth * scale,
        height: img.naturalHeight * scale,
      });
    };
  }, [photo.thumbSrc]);

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

  if (imgSize.width === 0) return null;

  return (
    <motion.div
      className={styles.photoCard}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        zIndex: zIndex,
        cursor: 'grab',
      }}
      initial={{ opacity: 0, scale: 0.8, rotate: rotation }}
      animate={{
        opacity: 1,
        scale: isHovered ? 1.02 : 1,
        rotate: rotation,
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
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
  );
}
