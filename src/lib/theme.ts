'use client';

import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // 初始化主题
  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored) {
      setTheme(stored);
    }
  }, []);

  // 解析实际主题
  useEffect(() => {
    const getResolvedTheme = (): 'light' | 'dark' => {
      if (theme === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      }
      return theme;
    };

    const resolved = getResolvedTheme();
    setResolvedTheme(resolved);
    document.documentElement.setAttribute('data-theme', resolved);
  }, [theme]);

  // 切换主题
  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', next);
      return next;
    });
  }, []);

  // 设置特定主题
  const setThemeValue = useCallback((value: Theme) => {
    setTheme(value);
    localStorage.setItem('theme', value);
  }, []);

  return {
    theme,
    resolvedTheme,
    toggleTheme,
    setTheme: setThemeValue,
    isDark: resolvedTheme === 'dark',
  };
}
