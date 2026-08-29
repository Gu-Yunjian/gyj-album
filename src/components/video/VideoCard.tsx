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
  const parsed = video.provider === 'bilibili'
    ? parseBilibiliUrl(video.url)
    : null;

  if (video.provider === 'bilibili' && !parsed) return null;

  return (
    <article className={styles.card}>
      <div className={styles.frame}>
        {video.provider === 'mp4' ? (
          <video
            src={video.url}
            title={video.title}
            controls
            preload="metadata"
            playsInline
          />
        ) : (
          <iframe
            src={buildBilibiliPlayerUrl(parsed!)}
            title={video.title}
            loading="lazy"
            allow="fullscreen; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>
      <div className={styles.meta}>
        <h2 className={styles.title}>{video.title}</h2>
        <a
          className={styles.externalLink}
          href={video.url}
          target="_blank"
          rel="noreferrer"
        >
          {video.provider === 'bilibili' ? '在 B 站观看' : '打开视频文件'}
        </a>
      </div>
    </article>
  );
}
