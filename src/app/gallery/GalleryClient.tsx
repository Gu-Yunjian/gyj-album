'use client';

import { useState, useMemo } from 'react';
import { GalleryPhoto } from '@/lib/photos';
import Navigation from '@/components/layout/Navigation';
import OverviewGrid from '@/components/gallery/OverviewGrid';
import Lightbox from '@/components/ui/Lightbox';

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

  const lightboxPhotos = useMemo(() => {
    return photos.map(p => ({
      src: p.src,
      alt: p.info?.title || '',
      photoTitle: p.info?.title || '',
      album: p.album,
      albumTitle: p.albumTitle,
      index: p.index,
      exif: p.exif,
    }));
  }, [photos]);

  const gridPhotos = useMemo(() => {
    return photos.map(p => ({
      ...p,
      thumbSrc: p.mediumSrc,
    }));
  }, [photos]);

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const handlePrev = () => {
    setCurrentIndex(i => (i === 0 ? photos.length - 1 : i - 1));
  };

  const handleNext = () => {
    setCurrentIndex(i => (i === photos.length - 1 ? 0 : i + 1));
  };

  return (
    <main>
      <Navigation />

      <OverviewGrid photos={gridPhotos} onPhotoClick={openLightbox} />

      <Lightbox
        photos={lightboxPhotos}
        currentIndex={currentIndex}
        isOpen={lightboxOpen}
        onClose={closeLightbox}
        onPrev={handlePrev}
        onNext={handleNext}
      />
    </main>
  );
}
