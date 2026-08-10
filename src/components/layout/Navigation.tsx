'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import styles from './Navigation.module.css';

interface NavigationProps {
  rightSlot?: ReactNode;
}

export default function Navigation({ rightSlot }: NavigationProps) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Link href="/" className={`${styles.logo} nav-link`}>
          GU YUN-JIAN PROJECTS
        </Link>
        <nav className={styles.nav}>
          <Link href="/gallery" className={`${styles.navLink} nav-link`}>
            画廊
          </Link>
          <Link href="/collections" className={`${styles.navLink} nav-link`}>
            影集
          </Link>
          <Link href="/videos" className={`${styles.navLink} nav-link`}>
            视频
          </Link>
          <Link href="/about" className={`${styles.navLink} nav-link`}>
            关于
          </Link>
        </nav>
      </div>
      {rightSlot && <div className={styles.right}>{rightSlot}</div>}
    </header>
  );
}
