'use client';

import { useState } from 'react';
import styles from './GalleryFilter.module.css';

export const GALLERY_FILTER_TAGS = ['人像', '毕业照', 'cosplay', '情侣', '单人', '多人'] as const;

export type GalleryFilterTag = typeof GALLERY_FILTER_TAGS[number];

interface GalleryFilterProps {
  selectedTags: GalleryFilterTag[];
  onChange: (tags: GalleryFilterTag[]) => void;
}

export default function GalleryFilter({ selectedTags, onChange }: GalleryFilterProps) {
  const hasActiveFilter = selectedTags.length > 0;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      setMobileMenuOpen(false);
      return;
    }

    onChange([value as GalleryFilterTag]);
    setMobileMenuOpen(false);
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

      <div className={styles.mobileFilter}>
        <button
          type="button"
          className={styles.mobileFilterButton}
          aria-label="打开照片筛选"
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-gallery-filter-menu"
          onClick={() => setMobileMenuOpen(open => !open)}
        >
          <svg className={styles.mobileFilterIcon} viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 5h16l-6.25 7.1v5.4l-3.5 1.5v-6.9L4 5Z" />
          </svg>
          {hasActiveFilter && <span className={styles.mobileFilterIndicator} aria-hidden="true" />}
        </button>

        {mobileMenuOpen && (
          <div
            id="mobile-gallery-filter-menu"
            className={styles.mobileFilterMenu}
            role="menu"
            aria-label="照片筛选选项"
          >
            <button
              type="button"
              role="menuitemradio"
              aria-checked={!hasActiveFilter}
              className={`${styles.mobileFilterOption} ${!hasActiveFilter ? styles.active : ''}`}
              onClick={() => handleMobileSelect('全部')}
            >
              全部
            </button>
            {GALLERY_FILTER_TAGS.map(tag => (
              <button
                type="button"
                role="menuitemradio"
                aria-checked={selectedTags.includes(tag)}
                className={`${styles.mobileFilterOption} ${selectedTags.includes(tag) ? styles.active : ''}`}
                onClick={() => handleMobileSelect(tag)}
                key={tag}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
