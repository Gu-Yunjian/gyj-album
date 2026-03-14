'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import { CaretLeft, CaretRight, SpeakerHigh, SpeakerSlash, X, Moon, Sun, CaretUp, CaretDown } from '@phosphor-icons/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlbumInfo } from '@/lib/photos';

import styles from './AlbumView.module.css';

interface AlbumViewProps {
  album: AlbumInfo;
  allPhotos?: Record<string, {
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

const THUMBNAILS_PER_ROW = 3;
const VISIBLE_ROWS = 3;
const AUTO_HIDE_DELAY = 3000;
const ROW_HEIGHT = 66;

export default function AlbumView({ album, allPhotos = {} }: AlbumViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [showMobileControls, setShowMobileControls] = useState(false); // 移动端控制按钮显示状态
  
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTouchDevice = useRef(false);

  // Embla Carousel 配置
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'center',
    containScroll: false,
    dragFree: false,
  });

  // 检测触屏设备
  useEffect(() => {
    isTouchDevice.current = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }, []);

  // 监听轮播变化
  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setCurrentIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  // 从 URL 参数初始化滚动到目标照片
  useEffect(() => {
    if (!emblaApi) return;
    
    const targetPhoto = searchParams.get('photo');
    if (targetPhoto) {
      const index = album.photos.findIndex(p => p.startsWith(targetPhoto));
      if (index >= 0) {
        emblaApi.scrollTo(index);
      }
    }
  }, [emblaApi, searchParams, album.photos]);

  // 九宫格滚动同步
  useEffect(() => {
    const currentRow = Math.floor(currentIndex / THUMBNAILS_PER_ROW);
    const totalRows = Math.ceil(album.photos.length / THUMBNAILS_PER_ROW);
    
    let targetRow: number;
    if (currentRow === 0) {
      targetRow = 0;
    } else if (currentRow >= totalRows - 1) {
      targetRow = Math.max(0, totalRows - VISIBLE_ROWS);
    } else {
      targetRow = currentRow - 1;
    }
    
    setScrollY(targetRow * ROW_HEIGHT);
  }, [currentIndex, album.photos.length]);

  const currentPhoto = album.photos[currentIndex];
  const currentPhotoStem = currentPhoto.replace(/\.[^/.]+$/, '');
  const currentInfo = album.photoInfos[currentPhotoStem];
  
  const photoKey = `${album.name}/${currentPhotoStem}`;
  const photoData = allPhotos[photoKey];
  const exifData = photoData?.exif;

  const formatExif = () => {
    if (!exifData) return null;
    const parts: string[] = [];
    if (exifData.aperture) parts.push(exifData.aperture);
    if (exifData.shutterSpeed) parts.push(exifData.shutterSpeed);
    if (exifData.iso) parts.push(`ISO ${exifData.iso}`);
    return parts.length > 0 ? parts.join(' · ') : null;
  };

  const revealControls = useCallback(() => {
    setShowControls(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => setShowControls(false), AUTO_HIDE_DELAY);
  }, []);

  const handleMouseEnter = () => !isTouchDevice.current && setShowControls(true);
  const handleMouseLeave = () => !isTouchDevice.current && setShowControls(false);

  useEffect(() => () => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
  }, []);

  const handleContextMenu = (e: React.MouseEvent) => e.preventDefault();
  const handleDragStart = (e: React.DragEvent) => e.preventDefault();

  const goToPrev = useCallback(() => {
    if (emblaApi) {
      emblaApi.scrollPrev();
      revealControls();
    }
  }, [emblaApi, revealControls]);

  const goToNext = useCallback(() => {
    if (emblaApi) {
      emblaApi.scrollNext();
      revealControls();
    }
  }, [emblaApi, revealControls]);

  const scrollTo = useCallback((index: number) => {
    if (!emblaApi) return;
    
    const distance = Math.abs(index - currentIndex);
    
    if (distance <= 1) {
      emblaApi.scrollTo(index);
    } else {
      emblaApi.scrollTo(index, true);
    }
  }, [emblaApi, currentIndex]);

  const toggleBgm = useCallback(() => {
    setIsPlaying(!isPlaying);
    revealControls();
  }, [isPlaying, revealControls]);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(!isDarkMode);
    revealControls();
  }, [isDarkMode, revealControls]);

  const togglePanel = useCallback(() => {
    setIsPanelOpen(prev => !prev);
  }, []);

  const closePanel = useCallback(() => {
    setIsPanelOpen(false);
  }, []);

  // 移动端按钮始终叠加显示（不再区分横竖屏）
  const toggleMobileControls = useCallback(() => {
    setShowMobileControls(prev => !prev);
  }, []);

  // 九宫格滚轮滚动
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const totalRows = Math.ceil(album.photos.length / THUMBNAILS_PER_ROW);
    const maxRowIndex = Math.max(0, totalRows - VISIBLE_ROWS);
    const currentRowIndex = Math.round(scrollY / ROW_HEIGHT);
    
    const targetRowIndex = e.deltaY > 0 
      ? Math.min(currentRowIndex + 1, maxRowIndex)
      : Math.max(currentRowIndex - 1, 0);
    
    setScrollY(targetRowIndex * ROW_HEIGHT);
  }, [album.photos.length, scrollY]);

  // 面板手势
  const panelTouchStart = useRef<{ y: number } | null>(null);
  
  const handlePanelTouchStart = useCallback((e: React.TouchEvent) => {
    panelTouchStart.current = { y: e.touches[0].clientY };
  }, []);

  const handlePanelTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!panelTouchStart.current) return;
    const deltaY = e.changedTouches[0].clientY - panelTouchStart.current.y;
    panelTouchStart.current = null;
    
    if (Math.abs(deltaY) > 50) {
      setIsPanelOpen(deltaY < 0);
    }
  }, []);

  const containerClass = `${styles.container} ${isDarkMode ? styles.dark : ''} ${showControls ? styles.showControls : ''} ${isPanelOpen ? styles.panelOpen : ''} ${showMobileControls ? styles.showMobileControls : ''}`;

  return (
    <div className={containerClass}>
      <div className={styles.main} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {/* 移动端顶部信息栏 - 相册维度信息 */}
        <div className={styles.mobileHeader}>
          <div className={styles.mobileHeaderContent}>
            <h1 className={styles.mobileTitle}>{album.title}</h1>
            {album.subtitle && <p className={styles.mobileSubtitle}>{album.subtitle}</p>}
            <div className={styles.mobileCounter}>{currentIndex + 1} / {album.photos.length}</div>
          </div>
          <div className={styles.mobileHeaderGradient}></div>
        </div>

        {/* Embla 轮播 */}
        <div 
          className={styles.carousel} 
          ref={emblaRef}
          onContextMenu={handleContextMenu}
          onClick={() => {
            closePanel();
            toggleMobileControls();
          }}
        >
          <div className={styles.carouselContainer}>
            {album.photos.map((photo, index) => (
              <div 
                key={photo} 
                className={styles.carouselSlide}
              >
                <img 
                  src={`/photos/${album.name}/${photo}`}
                  alt={index === currentIndex ? (currentInfo?.title || album.title) : ''}
                  className={styles.carouselImage}
                  draggable={false}
                  onDragStart={handleDragStart}
                  loading={Math.abs(index - currentIndex) <= 1 ? 'eager' : 'lazy'}
                  decoding={Math.abs(index - currentIndex) <= 1 ? 'sync' : 'async'}
                />
              </div>
            ))}
          </div>
        </div>

        {/* 桌面端控制按钮 */}
        <div className={styles.controls}>
          <button className={styles.controlButton} onClick={() => router.push('/collections')} aria-label="关闭"><X size={20} /></button>
          <button className={styles.controlButton} onClick={toggleDarkMode} aria-label={isDarkMode ? '切换日间模式' : '切换夜间模式'}>{isDarkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
        </div>
        
        {album.photos.length > 1 && (<>
          {currentIndex > 0 && <button className={`${styles.nav} ${styles.navPrev}`} onClick={goToPrev}><CaretLeft size={32} /></button>}
          {currentIndex < album.photos.length - 1 && <button className={`${styles.nav} ${styles.navNext}`} onClick={goToNext}><CaretRight size={32} /></button>}
        </>)}

        {/* 移动端控制按钮 */}
        <div className={styles.mobileControls}>
          <button className={styles.mobileControlBtn} onClick={() => router.push('/collections')} aria-label="关闭"><X size={18} /></button>
          <button className={styles.mobileControlBtn} onClick={toggleDarkMode} aria-label={isDarkMode ? '切换日间模式' : '切换夜间模式'}>{isDarkMode ? <Sun size={18} /> : <Moon size={18} />}</button>
          {album.hasBgm && (
            <button className={styles.mobileControlBtn} onClick={toggleBgm} aria-label={isPlaying ? '静音' : '播放'}>
              {isPlaying ? <SpeakerHigh size={18} /> : <SpeakerSlash size={18} />}
            </button>
          )}
          <button className={styles.mobileControlBtn} onClick={togglePanel} aria-label={isPanelOpen ? '收起面板' : '展开面板'}>
            {isPanelOpen ? <CaretDown size={18} /> : <CaretUp size={18} />}
          </button>
        </div>
      </div>

      <aside className={styles.sidebar}>
        {/* 桌面端结构 */}
        <div className={styles.desktopLayout}>
          <header className={styles.header}>
            <h1 className={styles.title}>{album.title}</h1>
            <p className={styles.subtitle}>{album.subtitle}</p>
            <div className={styles.counter}>{currentIndex + 1} / {album.photos.length}</div>
          </header>
          <div className={styles.info}>
            {currentInfo && (<><h2 className={styles.photoTitle}>{currentInfo.title}</h2>{currentInfo.desc && <p className={styles.photoDesc}>{currentInfo.desc}</p>}</>)}
            {formatExif() && <p className={styles.photoExif}>{formatExif()}</p>}
          </div>
          {album.hasBgm && <div className={styles.bgm}><button className={styles.bgmButton} onClick={toggleBgm}>{isPlaying ? <SpeakerHigh size={20} /> : <SpeakerSlash size={20} />}<span>{isPlaying ? '播放中' : '已静音'}</span></button></div>}
          <div className={styles.bottom}>
            {album.photos.length > 1 && (
              <div className={styles.thumbnailsContainer} onWheel={handleWheel}>
                <div className={styles.thumbnailsGrid} style={{ transform: `translateY(-${scrollY}px)` }}>
                  {album.photos.map((photo, index) => (
                    <button 
                      key={photo} 
                      className={`${styles.thumbnail} ${index === currentIndex ? styles.thumbnailActive : ''}`} 
                      onClick={() => scrollTo(index)}
                      onContextMenu={handleContextMenu}
                    >
                      <Image src={`/thumbnails/${album.name}/${photo}`} alt="" width={54} height={54} className={styles.thumbnailImage} draggable={false} onDragStart={handleDragStart} loading="lazy" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 移动端结构 - 只保留照片相关信息 */}
        <div 
          className={styles.mobilePanel}
          onTouchStart={handlePanelTouchStart}
          onTouchEnd={handlePanelTouchEnd}
        >
          <div className={styles.panelHandle} onClick={togglePanel}>
            <div className={styles.panelHandleBar}></div>
          </div>
          <div className={styles.panelContent}>
            {/* 只保留照片维度信息 */}
            <div className={styles.info}>
              {currentInfo?.title && <h2 className={styles.photoTitle}>{currentInfo.title}</h2>}
              {currentInfo?.desc && <p className={styles.photoDesc}>{currentInfo.desc}</p>}
              {formatExif() && <p className={styles.photoExif}>{formatExif()}</p>}
            </div>
            <div className={styles.bottom}>
              {album.photos.length > 1 && (
                <div className={styles.thumbnailsMobile}>
                  <div className={styles.thumbnailsMobileTrack}>
                    {album.photos.map((photo, index) => (
                      <button 
                        key={photo} 
                        className={`${styles.thumbnailMobile} ${index === currentIndex ? styles.thumbnailActive : ''}`} 
                        onClick={() => scrollTo(index)}
                        onContextMenu={handleContextMenu}
                      >
                        <Image src={`/thumbnails/${album.name}/${photo}`} alt="" width={48} height={48} className={styles.thumbnailImage} draggable={false} onDragStart={handleDragStart} loading="lazy" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
