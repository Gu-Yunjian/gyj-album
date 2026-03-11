'use client';

import styles from './ViewToggle.module.css';

type ViewMode = 'overview' | 'index';

interface ViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export default function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  return (
    <div className={styles.toggle}>
      <button
        onClick={() => onViewChange('overview')}
        className={`${styles.button} ${currentView === 'overview' ? styles.active : ''}`}
      >
        网格
      </button>
      <button
        onClick={() => onViewChange('index')}
        className={`${styles.button} ${currentView === 'index' ? styles.active : ''}`}
      >
        列表
      </button>
    </div>
  );
}
