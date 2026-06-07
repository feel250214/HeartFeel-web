import { useEffect, useState } from 'react';
import type { Settings } from './types';

export const CHAPTER_LENGTH = 8;

export const defaultSettings: Settings = {
  darkMode: false,
  showPhonetic: true,
  showNeighbors: true,
  selectableText: false,
  pronounceLang: 'en-US',
  pronounceRate: 0.95,
  pronounceLoop: false,
  ignoreCase: true,
  dictationMode: false,
  hideInDictation: 'word',
  randomOrder: false,
  loopTimes: 1,
};

export function safeJson<T>(raw: string | null, fallback: T): T {
  if (!raw) {
    return fallback;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function useLocalStorageState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => safeJson<T>(localStorage.getItem(key), fallback));

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}
