'use client';

import { useState, useMemo } from 'react';
import { GalleryPhoto } from '@/lib/photos';
import Navigation from '@/components/layout/Navigation';
import GalleryFilter, { GalleryFilterTag } from '@/components/gallery/GalleryFilter';
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
  const [selectedTags, setSelectedTags] = useState<GalleryFilterTag[]>([]);

  const taggedPhotos = useMemo(() => {
    return photos.map((photo, photoIndex) => ({
      ...photo,
      tags: getMockTags(photo, photoIndex),
    }));
  }, [photos]);

  const filteredPhotos = useMemo(() => {
    if (selectedTags.length === 0) return taggedPhotos;

    return taggedPhotos.filter(photo => selectedTags.some(tag => photo.tags.includes(tag)));
  }, [selectedTags, taggedPhotos]);

  const lightboxPhotos = useMemo(() => {
    return filteredPhotos.map(p => ({
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
  }, [filteredPhotos]);

  const gridPhotos = useMemo(() => {
    return filteredPhotos.map(p => ({
      ...p,
      thumbSrc: p.mediumSrc,
    }));
  }, [filteredPhotos]);

  const openLightbox = (index: number, sourceRect: DOMRect) => {
    if (filteredPhotos.length === 0) return;

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
      <Navigation
        rightSlot={
          <GalleryFilter
            selectedTags={selectedTags}
            onChange={setSelectedTags}
          />
        }
      />

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

function getMockTags(photo: GalleryPhoto, index: number): GalleryFilterTag[] {
  const text = `${photo.albumTitle} ${photo.info?.title || ''} ${photo.info?.desc || ''}`.toLowerCase();
  const tags = new Set<GalleryFilterTag>();

  if (/人像|portrait|毕业|cos|情侣|单人|多人/.test(text) || index % 2 === 0) {
    tags.add('人像');
  }

  if (/毕业|校园|school|graduate/.test(text) || index % 7 === 0) {
    tags.add('毕业照');
  }

  if (/cos|cosplay/.test(text) || index % 11 === 0) {
    tags.add('cosplay');
  }

  if (/情侣|couple/.test(text) || index % 5 === 0) {
    tags.add('情侣');
  }

  tags.add(index % 3 === 0 ? '多人' : '单人');

  return Array.from(tags);
}
