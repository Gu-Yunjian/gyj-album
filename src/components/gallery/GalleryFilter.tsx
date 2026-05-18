'use client';

import styles from './GalleryFilter.module.css';

export const GALLERY_FILTER_TAGS = ['人像', '毕业照', 'cosplay', '情侣', '单人', '多人'] as const;

export type GalleryFilterTag = typeof GALLERY_FILTER_TAGS[number];

interface GalleryFilterProps {
  selectedTags: GalleryFilterTag[];
  onChange: (tags: GalleryFilterTag[]) => void;
}

export default function GalleryFilter({ selectedTags, onChange }: GalleryFilterProps) {
  const hasActiveFilter = selectedTags.length > 0;
  const mobileValue = selectedTags[0] || '全部';

  const toggleTag = (tag: GalleryFilterTag) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter(item => item !== tag));
      return;
    }

    onChange([...selectedTags, tag]);
  };

  const handleMobileSelect = (value: string) => {
    if (value === '全部') {
      onChange([]);
      return;
    }

    onChange([value as GalleryFilterTag]);
  };

  return (
    <div className={styles.filter} aria-label="照片筛选">
      <div className={styles.chips}>
        <button
          type="button"
          className={`${styles.chip} ${!hasActiveFilter ? styles.active : ''}`}
          onClick={() => onChange([])}
          aria-pressed={!hasActiveFilter}
        >
          全部
        </button>
        {GALLERY_FILTER_TAGS.map(tag => (
          <button
            type="button"
            key={tag}
            className={`${styles.chip} ${selectedTags.includes(tag) ? styles.active : ''}`}
            onClick={() => toggleTag(tag)}
            aria-pressed={selectedTags.includes(tag)}
          >
            {tag}
          </button>
        ))}
      </div>

      <label className={styles.mobileSelectLabel}>
        <span className={styles.srOnly}>照片筛选</span>
        <span className={styles.mobileSelectSizer} aria-hidden="true">
          {mobileValue}
        </span>
        <select
          className={styles.mobileSelect}
          value={mobileValue}
          onChange={(event) => handleMobileSelect(event.target.value)}
          aria-label="照片筛选"
        >
          <option value="全部">全部</option>
          {GALLERY_FILTER_TAGS.map(tag => (
            <option value={tag} key={tag}>{tag}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
