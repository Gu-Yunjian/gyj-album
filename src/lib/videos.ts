import fs from 'node:fs/promises';
import path from 'node:path';
import { normalizeVideoConfig } from './bilibili';

export async function getVideos() {
  try {
    const filePath = path.join(
      process.cwd(),
      'public',
      'content',
      'videos.json'
    );
    const raw = await fs.readFile(filePath, 'utf8');
    return normalizeVideoConfig(JSON.parse(raw));
  } catch (error) {
    console.error('Failed to load videos.json:', error);
    return [];
  }
}
