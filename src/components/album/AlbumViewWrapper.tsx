'use client';

import { Suspense } from 'react';
import AlbumView from './AlbumView';
import { AlbumInfo } from '@/lib/photos';

interface AlbumViewWrapperProps {
  album: AlbumInfo;
  allPhotos: Record<string, {
    filename: string;
    originalName: string;
    mainSize: number;
    thumbSize: number;
    exif?: {
      aperture?: string;
      shutterSpeed?: string;
      iso?: number;
      dateTaken?: string;
      camera?: string;
    };
  }>;
}

function AlbumViewContent({ album, allPhotos }: AlbumViewWrapperProps) {
  return <AlbumView album={album} allPhotos={allPhotos} />;
}

export default function AlbumViewWrapper({ album, allPhotos }: AlbumViewWrapperProps) {
  return (
    <Suspense fallback={<div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>加载中...</div>}>
      <AlbumViewContent album={album} allPhotos={allPhotos} />
    </Suspense>
  );
}
