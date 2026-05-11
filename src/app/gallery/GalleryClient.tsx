'use client';

import { useState, useMemo } from 'react';
import { GalleryPhoto } from '@/lib/photos';
import Navigation from '@/components/layout/Navigation';
import OverviewGrid from '@/components/gallery/OverviewGrid';
import Lightbox, { LightboxSourceRect } from '@/components/ui/Lightbox';

interface Profile {
  name?: string;
  school?: string;
  slogan?: string;
}

interface GalleryClientProps {
  photos: GalleryPhoto[];
  profile: Profile;
}

export default function GalleryClient({ photos, profile }: GalleryClientProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxSourceRect, setLightboxSourceRect] = useState<LightboxSourceRect | null>(null);

  const lightboxPhotos = useMemo(() => {
    return photos.map(p => ({
      src: p.src,
      previewSrc: p.mediumSrc,
      alt: p.info?.title || '',
      photoTitle: p.info?.title || '',
      album: p.album,
      albumTitle: p.albumTitle,
      index: p.index,
      width: p.width,
      height: p.height,
      exif: p.exif,
    }));
  }, [photos]);

  const gridPhotos = useMemo(() => {
    return photos.map(p => ({
      ...p,
      thumbSrc: p.mediumSrc,
    }));
  }, [photos]);

  const openLightbox = (index: number, sourceRect: DOMRect) => {
    setLightboxSourceRect({
      top: sourceRect.top,
      left: sourceRect.left,
      width: sourceRect.width,
      height: sourceRect.height,
    });
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  return (
    <main>
      <Navigation />

      <OverviewGrid photos={gridPhotos} onPhotoClick={openLightbox} />

      <Lightbox
        photos={lightboxPhotos}
        currentIndex={currentIndex}
        isOpen={lightboxOpen}
        sourceRect={lightboxSourceRect}
        onClose={closeLightbox}
      />
    </main>
  );
}
