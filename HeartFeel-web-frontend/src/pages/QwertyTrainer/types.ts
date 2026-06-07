export type LanguageCategory = 'en' | 'ja' | 'code' | 'custom' | string;

export type WordEntry = {
  name: string;
  trans: string[];
  usphone?: string;
  ukphone?: string;
  tags?: string[];
  examples?: string[];
};

export type Dictionary = {
  id: string;
  name: string;
  description?: string;
  category: string;
  length: number;
  language: string;
  languageCategory: LanguageCategory;
  visibility?: string;
  words: WordEntry[];
};

export type Settings = {
  darkMode: boolean;
  showPhonetic: boolean;
  showNeighbors: boolean;
  selectableText: boolean;
  pronounceLang: 'en-US' | 'en-GB' | 'ja-JP';
  pronounceRate: number;
  pronounceLoop: boolean;
  ignoreCase: boolean;
  dictationMode: boolean;
  hideInDictation: 'word' | 'trans' | 'all';
  randomOrder: boolean;
  loopTimes: number;
};

export type WordRecord = {
  id?: number;
  word: string;
  dict: string;
  chapter: number | null;
  timestamp: number;
  timing: number[];
  wrongCount: number;
  mistakes: Record<number, string[]>;
};

export type ChapterRecord = {
  id?: number;
  dict: string;
  chapter: number | null;
  timestamp: number;
  time: number;
  correctCount: number;
  wrongCount: number;
  wordCount: number;
  correctWordIndexes: number[];
  wordNumber: number;
  wordRecordIds: number[];
};

export type ReviewSession = {
  id?: number;
  dict: string;
  index: number;
  createTime: number;
  isFinished: boolean;
  words: WordEntry[];
};

export type TrainerStats = {
  chapterRecords: ChapterRecord[];
  wordRecords: WordRecord[];
  totalTime: number;
  totalWords: number;
  averageWpm: number;
  averageAccuracy: number;
  wrongWords: Array<{ word: string; count: number }>;
};
