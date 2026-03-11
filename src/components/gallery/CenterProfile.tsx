'use client';

import Link from 'next/link';
import styles from './CenterProfile.module.css';

interface ProfileData {
  name?: string;
  school?: string;
  slogan?: string;
}

interface CenterProfileProps {
  profile: ProfileData;
}

export default function CenterProfile({ profile }: CenterProfileProps) {
  return (
    <Link href="/about" className={styles.card}>
      <div className={styles.content}>
        <h1 className={styles.name}>{profile.name || '摄影师'}</h1>
        {profile.school && <p className={styles.school}>{profile.school}</p>}
        {profile.slogan && <p className={styles.slogan}>{profile.slogan}</p>}
        <span className={styles.more}>了解更多 →</span>
      </div>
    </Link>
  );
}
