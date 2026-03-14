import { getAlbums } from '@/lib/photos';
import Navigation from '@/components/layout/Navigation';
import CollectionCard from '@/components/album/CollectionCard';
import styles from './page.module.css';

export const metadata = {
  title: '作品集 | GU-PROJECTS',
  description: '摄影作品集',
};

export default async function CollectionsPage() {
  const albums = await getAlbums();

  return (
    <main className={styles.main}>
      <Navigation />

      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>作品集</h1>
          <p className={styles.subtitle}>共 {albums.length} 个影集</p>
        </header>

        <div className={styles.grid}>
          {albums.map((album) => (
            <CollectionCard
              key={album.name}
              name={album.name}
              title={album.title}
              subtitle={album.subtitle}
              cover={album.cover}
              photoCount={album.photos.length}
            />
          ))}
        </div>

        {/* Copyright Footer */}
        <footer className="copyright-footer">
          Copyright © 2026 辜云剑，All rights reserved.
        </footer>
      </div>
    </main>
  );
}
