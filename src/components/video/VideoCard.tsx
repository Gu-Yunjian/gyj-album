import {
  buildBilibiliPlayerUrl,
  parseBilibiliUrl,
  type VideoEntry,
} from '@/lib/bilibili';
import styles from './VideoCard.module.css';

interface VideoCardProps {
  video: VideoEntry;
}

export default function VideoCard({ video }: VideoCardProps) {
  const parsed = parseBilibiliUrl(video.url);

  if (!parsed) {
    return null;
  }

  return (
    <article className={styles.card}>
      <div className={styles.frame}>
        <iframe
          src={buildBilibiliPlayerUrl(parsed)}
          title={video.title}
          loading="lazy"
          allow="fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
      <div className={styles.meta}>
        <h2 className={styles.title}>{video.title}</h2>
        <a
          className={styles.externalLink}
          href={video.url}
          target="_blank"
          rel="noreferrer"
        >
          在 B 站观看
        </a>
      </div>
    </article>
  );
}
