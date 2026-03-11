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

interface HomeClientProps {
  photos: GalleryPhoto[];
  profile: Profile;
}

export default function HomeClient({ photos, profile }: HomeClientProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 灯箱照片列表
  const lightboxPhotos = useMemo(() => {
    return photos.map(p => ({
      src: p.src,
      alt: p.info?.title || p.albumTitle,
      album: p.album,
      index: p.index,
    }));
  }, [photos]);

  // 打开灯箱
  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  // 关闭灯箱
  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  // 上一张
  const handlePrev = () => {
    setCurrentIndex(i => (i === 0 ? photos.length - 1 : i - 1));
  };

  // 下一张
  const handleNext = () => {
    setCurrentIndex(i => (i === photos.length - 1 ? 0 : i + 1));
  };

  return (
    <main>
      <Navigation />

      <OverviewGrid photos={photos} onPhotoClick={openLightbox} />

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
