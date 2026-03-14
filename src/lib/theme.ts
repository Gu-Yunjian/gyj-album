'use client';

import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // 初始化主题 - 不再检测系统主题
  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null;
    // 只接受 light 或 dark，忽略 system
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored);
    }
  }, []);

  // 解析实际主题 - 移除系统检测
  useEffect(() => {
    setResolvedTheme(theme);
    document.documentElement.setAttribute('data-theme', theme);
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
