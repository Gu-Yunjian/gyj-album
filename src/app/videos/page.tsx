import Navigation from '@/components/layout/Navigation';
import VideoCard from '@/components/video/VideoCard';
import { getVideos } from '@/lib/videos';
import styles from './page.module.css';

export const metadata = {
  title: '视频 | GU-PROJECTS',
  description: '顾元杰的视频作品',
};

export default async function VideosPage() {
  const videos = await getVideos();

  return (
    <main className={styles.main}>
      <Navigation />
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>视频</h1>
        </header>

        {videos.length > 0 ? (
          <div className={styles.grid}>
            {videos.map(video => (
              <VideoCard key={video.url} video={video} />
            ))}
          </div>
        ) : (
          <p className={styles.empty}>暂时还没有视频</p>
        )}
      </div>
    </main>
  );
}
