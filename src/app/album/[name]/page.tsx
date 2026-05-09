import { getAlbum, getAllPhotosData } from '@/lib/photos';
import AlbumViewWrapper from '@/components/album/AlbumViewWrapper';
import styles from './page.module.css';

interface PageProps {
  params: Promise<{ name: string }>;
}

export async function generateStaticParams() {
  const { getAlbums } = await import('@/lib/photos');
  const albums = await getAlbums();
  return albums.map((album) => ({
    name: album.name,
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { name } = await params;
  // 解码 URL 编码的中文目录名
  const decodedName = decodeURIComponent(name);
  const album = await getAlbum(decodedName);
  return {
    title: album ? `${album.title} | GU-PROJECTS` : '影集 | GU-PROJECTS',
    description: album?.subtitle || '摄影作品',
  };
}

export default async function AlbumPage({ params }: PageProps) {
  const { name } = await params;
  // 解码 URL 编码的中文目录名
  const decodedName = decodeURIComponent(name);
  const album = await getAlbum(decodedName);

  if (!album) {
    return (
      <main className={styles.main}>
        <div className={styles.notFound}>
          <h1>影集不存在</h1>
        </div>
      </main>
    );
  }

  if (album.photos.length === 0) {
    return (
      <main className={styles.main}>
        <div className={styles.notFound}>
          <div>
            <h1>影集暂无照片</h1>
            <p>这个影集已经创建，还没有可展示的照片。</p>
          </div>
        </div>
      </main>
    );
  }

  const allPhotos = await getAllPhotosData();

  return (
    <main className={styles.main}>
      <AlbumViewWrapper album={album} allPhotos={allPhotos} />
    </main>
  );
}
