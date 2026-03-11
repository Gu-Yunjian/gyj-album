'use client';

import Link from 'next/link';
import styles from './Navigation.module.css';

export default function Navigation() {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Link href="/" className={`${styles.logo} nav-link`}>
          GU YUN-JIAN PROJECTS
        </Link>
        <nav className={styles.nav}>
          <Link href="/collections" className={`${styles.navLink} nav-link`}>
            影集
          </Link>
          <Link href="/about" className={`${styles.navLink} nav-link`}>
            关于
          </Link>
        </nav>
      </div>
    </header>
  );
}
