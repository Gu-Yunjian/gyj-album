import fs from 'fs/promises';
import path from 'path';
import { compileMDX } from 'next-mdx-remote/rsc';
import Navigation from '@/components/layout/Navigation';
import styles from './page.module.css';

interface AboutFrontmatter {
  name?: string;
  school?: string;
  slogan?: string;
}

export const metadata = {
  title: '关于 | GU-Album',
  description: '关于我',
};

export default async function AboutPage() {
  // 读取 about.md
  const contentPath = path.join(process.cwd(), 'public/content/about.md');

  let ContentComponent: React.ReactNode = null;
  let frontmatter: AboutFrontmatter = {};

  try {
    const fileContent = await fs.readFile(contentPath, 'utf-8');
    const { content, frontmatter: fm } = await compileMDX<AboutFrontmatter>({
      source: fileContent,
      options: { parseFrontmatter: true },
    });
    ContentComponent = content;
    frontmatter = fm;
  } catch (e) {
    console.error('Failed to load about.md:', e);
  }

  return (
    <main className={styles.main}>
      <Navigation />

      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>关于</h1>
        </header>

        <div className={styles.profile}>
          <h2 className={styles.name}>{frontmatter.name || '摄影师'}</h2>
          {frontmatter.school && (
            <p className={styles.school}>{frontmatter.school}</p>
          )}
          {frontmatter.slogan && (
            <p className={styles.slogan}>{frontmatter.slogan}</p>
          )}
        </div>

        <article className={styles.content}>
          {ContentComponent}
        </article>
      </div>
    </main>
  );
}
