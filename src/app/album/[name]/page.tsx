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
    title: album ? `${album.title} | GU-Album` : '影集 | GU-Album',
    description: album?.subtitle || '摄影作品',
  };
}

export default async function AlbumPage({ params }: PageProps) {
  const { name } = await params;
  // 解码 URL 编码的中文目录名
  const decodedName = decodeURIComponent(name);
  const album = await getAlbum(decodedName);
  const allPhotos = await getAllPhotosData();

  if (!album) {
    return (
      <main className={styles.main}>
        <div className={styles.notFound}>
          <h1>影集不存在</h1>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <AlbumViewWrapper album={album} allPhotos={allPhotos} />
    </main>
  );
}
