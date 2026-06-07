import Dexie, { type Table } from 'dexie';
import type { ChapterRecord, ReviewSession, WordRecord } from './types';

export class QwertyTrainerDB extends Dexie {
  wordRecords!: Table<WordRecord, number>;

  chapterRecords!: Table<ChapterRecord, number>;

  reviewSessions!: Table<ReviewSession, number>;

  constructor() {
    super('HeartFeelQwertyTrainerDB');
    this.version(1).stores({
      wordRecords: '++id, word, dict, chapter, timestamp, wrongCount, [dict+chapter]',
      chapterRecords: '++id, dict, chapter, timestamp, time, [dict+chapter]',
      reviewSessions: '++id, dict, createTime, isFinished',
    });
  }
}

export const db = new QwertyTrainerDB();

export async function loadTrainerStats() {
  const [chapterRecords, wordRecords] = await Promise.all([
    db.chapterRecords.toArray(),
    db.wordRecords.toArray(),
  ]);
  const totalTime = chapterRecords.reduce((sum, item) => sum + item.time, 0);
  const totalWords = chapterRecords.reduce((sum, item) => sum + item.wordCount, 0);
  const totalCorrect = chapterRecords.reduce((sum, item) => sum + item.correctCount, 0);
  const totalWrong = chapterRecords.reduce((sum, item) => sum + item.wrongCount, 0);
  const wrongMap = new Map<string, number>();
  wordRecords.forEach((record) => {
    if (record.wrongCount > 0) {
      wrongMap.set(record.word, (wrongMap.get(record.word) ?? 0) + record.wrongCount);
    }
  });
  return {
    chapterRecords,
    wordRecords,
    totalTime,
    totalWords,
    averageWpm: totalTime > 0 ? Math.round((totalWords / totalTime) * 60) : 0,
    averageAccuracy:
      totalCorrect + totalWrong > 0
        ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100)
        : 100,
    wrongWords: [...wrongMap.entries()]
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12),
  };
}
