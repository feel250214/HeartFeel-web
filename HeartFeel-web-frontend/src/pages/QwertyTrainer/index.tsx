import {
  deleteDictionaryUsingPost,
  getDictionaryContentUsingGet,
  listDictionaryVoByPageUsingPost,
  uploadDictionaryUsingPost,
} from '@/services/backend/qwertyDictionaryController';
import { synthesizeTtsUsingPost } from '@/services/backend/qwertyTtsController';
import {
  BarChartOutlined,
  BookOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EyeInvisibleOutlined,
  LeftOutlined,
  ReloadOutlined,
  RightOutlined,
  SettingOutlined,
  SoundOutlined,
  StepForwardOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import * as echarts from 'echarts';
import {
  Button,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  List,
  message,
  Modal,
  Popconfirm,
  Progress,
  Select,
  Space,
  Switch,
  Tag,
  Tooltip,
  Upload,
} from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { db, loadTrainerStats } from './db';
import './index.less';
import { CHAPTER_LENGTH, defaultSettings, useLocalStorageState } from './storage';
import type { ChapterRecord, Dictionary, Settings, TrainerStats, WordEntry, WordRecord } from './types';

type PracticeMode = 'practice' | 'dictation' | 'review';

function normalizeWord(word: string, ignoreCase: boolean) {
  return ignoreCase ? word.toLowerCase() : word;
}

function shuffleWords(words: WordEntry[]) {
  const copy = [...words];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function isPrintableKey(key: string) {
  return key.length === 1;
}

function fallbackSpeakWord(word: string, settings: Pick<Settings, 'pronounceLang' | 'pronounceRate'>) {
  if (!('speechSynthesis' in window) || !word.trim()) {
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = settings.pronounceLang;
  utterance.rate = settings.pronounceRate;
  window.speechSynthesis.speak(utterance);
}

function base64ToBlob(base64: string, mimeType = 'audio/wav') {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: mimeType });
}

function getYoudaoVoiceType(language: string, pronounceLang: Settings['pronounceLang']) {
  const normalizedLanguage = language.toLowerCase();
  if (normalizedLanguage.includes('ja') || pronounceLang === 'ja-JP') {
    return null;
  }
  return pronounceLang === 'en-GB' ? 0 : 1;
}

function buildYoudaoVoiceUrl(word: string, type: number) {
  const params = new URLSearchParams({
    audio: word,
    type: String(type),
  });
  return `https://dict.youdao.com/dictvoice?${params.toString()}`;
}

function normalizeApiWord(word: API.QwertyWordVO): WordEntry | null {
  const name = word.name?.trim();
  if (!name) {
    return null;
  }
  return {
    name,
    trans: word.trans?.filter(Boolean) ?? [],
    usphone: word.usphone,
    ukphone: word.ukphone,
    tags: word.tags?.filter(Boolean),
    examples: word.examples?.filter(Boolean),
  };
}

function downloadSampleDictionary() {
  const link = document.createElement('a');
  link.href = '/samples/qwerty-dictionary-sample.xlsx';
  link.download = 'qwerty-dictionary-sample.xlsx';
  link.click();
}

function renderWordCharacters(target: string, input: string) {
  return target.split('').map((char, index) => {
    const typed = input[index];
    const state = typed === undefined ? 'pending' : typed === char ? 'correct' : 'wrong';
    return (
      <span key={`${char}-${index}`} className={`char ${state}`}>
        {char === ' ' ? '·' : char}
      </span>
    );
  });
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="qwerty-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SettingSwitch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="qwerty-setting-switch">
      <span>{label}</span>
      <Switch checked={checked} onChange={onChange} />
    </label>
  );
}

const QwertyTrainer: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const [settings, setSettings] = useLocalStorageState<Settings>(
    'heartfeel_qwerty_settings',
    defaultSettings,
  );
  const [currentDictId, setCurrentDictId] = useLocalStorageState<string>(
    'heartfeel_qwerty_current_dict',
    '',
  );
  const [currentChapter, setCurrentChapter] = useLocalStorageState<number>(
    'heartfeel_qwerty_current_chapter',
    0,
  );

  const [dictionaryMetas, setDictionaryMetas] = useState<API.QwertyDictionaryVO[]>([]);
  const [dictionaryLoading, setDictionaryLoading] = useState(false);
  const [wordLoading, setWordLoading] = useState(false);
  const [currentWords, setCurrentWords] = useState<WordEntry[]>([]);
  const [mode, setMode] = useState<PracticeMode>('practice');
  const [reviewWords, setReviewWords] = useState<WordEntry[]>([]);
  const [unitIndex, setUnitIndex] = useState(0);
  const [input, setInput] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [correctKeys, setCorrectKeys] = useState(0);
  const [wrongKeys, setWrongKeys] = useState(0);
  const [currentWrongCount, setCurrentWrongCount] = useState(0);
  const [currentMistakes, setCurrentMistakes] = useState<Record<number, string[]>>({});
  const [letterTimes, setLetterTimes] = useState<number[]>([]);
  const [wordRecordIds, setWordRecordIds] = useState<number[]>([]);
  const [correctWordIndexes, setCorrectWordIndexes] = useState<number[]>([]);
  const [showAnswerByTab, setShowAnswerByTab] = useState(false);
  const [stats, setStats] = useState<TrainerStats | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [libraryDrawerOpen, setLibraryDrawerOpen] = useState(false);
  const [statsDrawerOpen, setStatsDrawerOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<UploadFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [form] = Form.useForm();
  const surfaceRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef('');
  const pronounceLoopTimerRef = useRef<number | null>(null);
  const lastAutoReadKeyRef = useRef('');
  const ttsAudioCacheRef = useRef<Map<string, string>>(new Map());
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const ttsFallbackWarnedRef = useRef(false);

  const currentMeta = useMemo(
    () => dictionaryMetas.find((item) => String(item.id) === currentDictId) ?? dictionaryMetas[0],
    [currentDictId, dictionaryMetas],
  );

  const currentDict: Dictionary | null = useMemo(() => {
    if (!currentMeta) {
      return null;
    }
    return {
      id: String(currentMeta.id),
      name: currentMeta.name ?? '未命名词库',
      description: currentMeta.description,
      category: currentMeta.category ?? 'Custom',
      length: currentMeta.wordCount ?? currentWords.length,
      language: currentMeta.language ?? 'en',
      languageCategory: currentMeta.languageCategory ?? 'custom',
      visibility: currentMeta.visibility,
      words: currentWords,
    };
  }, [currentMeta, currentWords]);

  const chapterCount = Math.max(1, Math.ceil((currentDict?.words.length ?? 0) / CHAPTER_LENGTH));

  const baseWords = useMemo(() => {
    if (mode === 'review') {
      return reviewWords;
    }
    if (!currentDict) {
      return [];
    }
    return currentDict.words.slice(
      currentChapter * CHAPTER_LENGTH,
      (currentChapter + 1) * CHAPTER_LENGTH,
    );
  }, [currentChapter, currentDict, mode, reviewWords]);

  const trainingWords = useMemo(() => {
    if (!baseWords.length) {
      return [];
    }
    return settings.randomOrder ? shuffleWords(baseWords) : baseWords;
  }, [baseWords, settings.randomOrder]);

  const totalUnits = Math.max(1, trainingWords.length * settings.loopTimes);
  const wordIndex = Math.min(trainingWords.length - 1, Math.floor(unitIndex / settings.loopTimes));
  const currentWord = trainingWords[wordIndex];
  const repeatIndex = (unitIndex % settings.loopTimes) + 1;
  const target = currentWord?.name ?? '';
  const progress = Math.min(100, Math.round((unitIndex / totalUnits) * 100));
  const wpm = elapsed > 0 ? Math.round((unitIndex / elapsed) * 60) : 0;
  const accuracy =
    correctKeys + wrongKeys > 0 ? Math.round((correctKeys / (correctKeys + wrongKeys)) * 100) : 100;
  const shouldHideWord =
    mode === 'dictation' && settings.dictationMode && ['word', 'all'].includes(settings.hideInDictation);
  const shouldHideTrans =
    mode === 'dictation' && settings.dictationMode && ['trans', 'all'].includes(settings.hideInDictation);
  const answerVisible = !shouldHideWord || showAnswerByTab;

  const refreshStats = useCallback(async () => {
    const nextStats = await loadTrainerStats();
    setStats(nextStats);
  }, []);

  const setInputValue = useCallback((value: string) => {
    inputRef.current = value;
    setInput(value);
  }, []);

  const resetRun = useCallback(
    (nextMode = mode) => {
      setMode(nextMode);
      setUnitIndex(0);
      setInputValue('');
      setIsActive(false);
      setIsFinished(false);
      setElapsed(0);
      setCorrectKeys(0);
      setWrongKeys(0);
      setCurrentWrongCount(0);
      setCurrentMistakes({});
      setLetterTimes([]);
      setWordRecordIds([]);
      setCorrectWordIndexes([]);
      setShowAnswerByTab(false);
      window.setTimeout(() => surfaceRef.current?.focus(), 0);
    },
    [mode, setInputValue],
  );

  const playAudioUrl = useCallback(async (audioUrl: string) => {
    currentAudioRef.current?.pause();
    const audio = new Audio(audioUrl);
    currentAudioRef.current = audio;
    await audio.play();
  }, []);

  const speakCurrentWord = useCallback(
    async (word: string) => {
      const text = word.trim();
      if (!text) {
        return;
      }
      const language = currentDict?.language || settings.pronounceLang;
      const localCacheKey = `${language}:${settings.pronounceRate}:${text}`;
      try {
        const youdaoType = getYoudaoVoiceType(language, settings.pronounceLang);
        if (youdaoType !== null) {
          await playAudioUrl(buildYoudaoVoiceUrl(text, youdaoType));
          return;
        }
        let audioUrl = ttsAudioCacheRef.current.get(localCacheKey);
        if (!audioUrl) {
          const response = await synthesizeTtsUsingPost({
            text,
            language,
            rate: settings.pronounceRate,
          });
          const audio = response.data;
          if (!audio?.audioBase64) {
            throw new Error('TTS audio is empty');
          }
          audioUrl = URL.createObjectURL(base64ToBlob(audio.audioBase64, audio.mimeType || 'audio/wav'));
          ttsAudioCacheRef.current.set(localCacheKey, audioUrl);
          if (audio.cacheKey) {
            ttsAudioCacheRef.current.set(audio.cacheKey, audioUrl);
          }
        }
        await playAudioUrl(audioUrl);
      } catch {
        try {
          let audioUrl = ttsAudioCacheRef.current.get(localCacheKey);
          if (!audioUrl) {
            const response = await synthesizeTtsUsingPost({
              text,
              language,
              rate: settings.pronounceRate,
            });
            const audio = response.data;
            if (!audio?.audioBase64) {
              throw new Error('TTS audio is empty');
            }
            audioUrl = URL.createObjectURL(base64ToBlob(audio.audioBase64, audio.mimeType || 'audio/wav'));
            ttsAudioCacheRef.current.set(localCacheKey, audioUrl);
            if (audio.cacheKey) {
              ttsAudioCacheRef.current.set(audio.cacheKey, audioUrl);
            }
          }
          await playAudioUrl(audioUrl);
        } catch {
          if (!ttsFallbackWarnedRef.current) {
            ttsFallbackWarnedRef.current = true;
            message.warning('Youdao and offline TTS are unavailable; browser pronunciation is used.');
          }
          fallbackSpeakWord(text, {
            pronounceLang: settings.pronounceLang,
            pronounceRate: settings.pronounceRate,
          });
        }
      }
    },
    [currentDict?.language, playAudioUrl, settings.pronounceLang, settings.pronounceRate],
  );

  useEffect(() => {
    return () => {
      currentAudioRef.current?.pause();
      ttsAudioCacheRef.current.forEach((audioUrl) => URL.revokeObjectURL(audioUrl));
      ttsAudioCacheRef.current.clear();
    };
  }, []);

  const loadDictionaries = useCallback(async () => {
    setDictionaryLoading(true);
    try {
      const res = await listDictionaryVoByPageUsingPost({
        current: 1,
        pageSize: 50,
        sortField: 'updateTime',
        sortOrder: 'descend',
      });
      const records = res.data?.records ?? [];
      setDictionaryMetas(records);
      if (!currentDictId && records[0]?.id) {
        setCurrentDictId(String(records[0].id));
      }
    } catch (error: any) {
      message.error(`词库列表加载失败：${error.message}`);
    } finally {
      setDictionaryLoading(false);
    }
  }, [currentDictId, setCurrentDictId]);

  const loadDictionaryContent = useCallback(
    async (id?: string) => {
      const dictionaryId = id || currentDictId || (dictionaryMetas[0]?.id ? String(dictionaryMetas[0].id) : '');
      if (!dictionaryId) {
        setCurrentWords([]);
        return;
      }
      setWordLoading(true);
      try {
        const res = await getDictionaryContentUsingGet({ id: Number(dictionaryId) });
        const words = (res.data ?? []).map(normalizeApiWord).filter(Boolean) as WordEntry[];
        setCurrentWords(words);
        setCurrentDictId(dictionaryId);
        setCurrentChapter(0);
        resetRun('practice');
      } catch (error: any) {
        setCurrentWords([]);
        message.error(`词库内容加载失败：${error.message}`);
      } finally {
        setWordLoading(false);
      }
    },
    [currentDictId, dictionaryMetas, resetRun, setCurrentChapter, setCurrentDictId],
  );

  useEffect(() => {
    void loadDictionaries();
    void refreshStats();
  }, []);

  useEffect(() => {
    if (!currentDictId && dictionaryMetas[0]?.id) {
      setCurrentDictId(String(dictionaryMetas[0].id));
      return;
    }
    if (currentDictId) {
      void loadDictionaryContent(currentDictId);
    }
  }, [currentDictId, dictionaryMetas.length]);

  useEffect(() => {
    if (currentChapter >= chapterCount) {
      setCurrentChapter(0);
    }
  }, [chapterCount, currentChapter, setCurrentChapter]);

  useEffect(() => {
    if (!isActive || isFinished) {
      return undefined;
    }
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [isActive, isFinished]);

  useEffect(() => {
    resetRun(mode);
  }, [currentChapter, settings.loopTimes, settings.randomOrder]);

  useEffect(() => {
    if (!target || wordLoading || isFinished) {
      return;
    }
    const autoReadKey = `${currentDict?.id ?? 'none'}:${mode}:${currentChapter}:${wordIndex}:${target}`;
    if (lastAutoReadKeyRef.current === autoReadKey) {
      return;
    }
    lastAutoReadKeyRef.current = autoReadKey;
    void speakCurrentWord(target);
  }, [
    currentChapter,
    currentDict?.id,
    isFinished,
    mode,
    speakCurrentWord,
    target,
    wordIndex,
    wordLoading,
  ]);

  useEffect(() => {
    if (pronounceLoopTimerRef.current) {
      window.clearInterval(pronounceLoopTimerRef.current);
      pronounceLoopTimerRef.current = null;
    }
    if (!settings.pronounceLoop || !target || wordLoading || isFinished) {
      return undefined;
    }
    pronounceLoopTimerRef.current = window.setInterval(() => {
      void speakCurrentWord(target);
    }, 3500);
    return () => {
      if (pronounceLoopTimerRef.current) {
        window.clearInterval(pronounceLoopTimerRef.current);
        pronounceLoopTimerRef.current = null;
      }
    };
  }, [
    isFinished,
    settings.pronounceLoop,
    speakCurrentWord,
    target,
    wordIndex,
    wordLoading,
  ]);

  useEffect(() => {
    if (!statsDrawerOpen || !chartRef.current || !stats) {
      return undefined;
    }
    const chart = echarts.init(chartRef.current, settings.darkMode ? 'dark' : undefined);
    const records = stats.chapterRecords.slice(-10);
    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' },
      grid: { left: 36, right: 16, top: 28, bottom: 28 },
      xAxis: { type: 'category', data: records.map((_, index) => `#${index + 1}`) },
      yAxis: { type: 'value' },
      series: [
        {
          name: 'WPM',
          type: 'line',
          smooth: true,
          data: records.map((item) => Math.round((item.wordCount / Math.max(item.time, 1)) * 60)),
          color: '#2563eb',
        },
        {
          name: '准确率',
          type: 'line',
          smooth: true,
          data: records.map((item) =>
            Math.round((item.correctCount / Math.max(item.correctCount + item.wrongCount, 1)) * 100),
          ),
          color: '#d97706',
        },
      ],
    });
    const resize = () => chart.resize();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      chart.dispose();
    };
  }, [settings.darkMode, stats, statsDrawerOpen]);

  const finishChapter = useCallback(
    async (
      finalWordRecordIds: number[],
      finalCorrectWordIndexes: number[],
      finalCorrectKeys = correctKeys,
      finalWrongKeys = wrongKeys,
    ) => {
      const record: ChapterRecord = {
        dict: currentDict?.id ?? 'unknown',
        chapter: mode === 'review' ? -1 : currentChapter,
        timestamp: Date.now(),
        time: Math.max(elapsed, 1),
        correctCount: finalCorrectKeys,
        wrongCount: finalWrongKeys,
        wordCount: totalUnits,
        correctWordIndexes: finalCorrectWordIndexes,
        wordNumber: trainingWords.length,
        wordRecordIds: finalWordRecordIds,
      };
      await db.chapterRecords.add(record);
      setIsFinished(true);
      setIsActive(false);
      await refreshStats();
      message.success(mode === 'dictation' ? '默写完成，记录已保存' : '本轮训练完成');
    },
    [
      correctKeys,
      currentChapter,
      currentDict?.id,
      elapsed,
      mode,
      refreshStats,
      totalUnits,
      trainingWords.length,
      wrongKeys,
    ],
  );

  const completeCurrentWord = useCallback(
    async (finalLetterTimes = letterTimes, finalCorrectKeys = correctKeys) => {
      const record: WordRecord = {
        word: target,
        dict: currentDict?.id ?? 'unknown',
        chapter: mode === 'review' ? -1 : currentChapter,
        timestamp: Date.now(),
        timing:
          finalLetterTimes.length > 1
            ? finalLetterTimes.slice(1).map((time, index) => time - finalLetterTimes[index])
            : [],
        wrongCount: currentWrongCount,
        mistakes: currentMistakes,
      };
      const id = await db.wordRecords.add(record);
      const nextWordRecordIds = [...wordRecordIds, id];
      const nextCorrectWordIndexes =
        currentWrongCount === 0 ? [...correctWordIndexes, wordIndex] : correctWordIndexes;
      setWordRecordIds(nextWordRecordIds);
      setCorrectWordIndexes(nextCorrectWordIndexes);
      setInputValue('');
      setCurrentWrongCount(0);
      setCurrentMistakes({});
      setLetterTimes([]);
      if (unitIndex + 1 >= totalUnits) {
        await finishChapter(nextWordRecordIds, nextCorrectWordIndexes, finalCorrectKeys, wrongKeys);
      } else {
        setUnitIndex((value) => value + 1);
      }
    },
    [
      correctKeys,
      correctWordIndexes,
      currentChapter,
      currentDict?.id,
      currentMistakes,
      currentWrongCount,
      finishChapter,
      letterTimes,
      mode,
      setInputValue,
      target,
      totalUnits,
      unitIndex,
      wordIndex,
      wordRecordIds,
      wrongKeys,
    ],
  );

  const skipWord = useCallback(() => {
    if (isFinished) {
      return;
    }
    setInputValue('');
    setCurrentWrongCount(0);
    setCurrentMistakes({});
    setLetterTimes([]);
    setWrongKeys((value) => value + 1);
    if (unitIndex + 1 >= totalUnits) {
      void finishChapter(wordRecordIds, correctWordIndexes);
    } else {
      setUnitIndex((value) => value + 1);
    }
  }, [correctWordIndexes, finishChapter, isFinished, setInputValue, totalUnits, unitIndex, wordRecordIds]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!currentWord || isFinished) {
        if (event.key === 'Enter') {
          resetRun(mode);
        }
        return;
      }
      const currentInput = inputRef.current;
      if (event.key === 'Escape') {
        setIsActive(false);
        return;
      }
      if (event.key === 'Enter') {
        setIsActive(true);
        return;
      }
      if (event.key === 'Tab') {
        event.preventDefault();
        setShowAnswerByTab(true);
        return;
      }
      if (event.key === 'Backspace') {
        event.preventDefault();
        setInputValue(currentInput.slice(0, -1));
        return;
      }
      if (event.key === ' ' && normalizeWord(target[currentInput.length] ?? '', settings.ignoreCase) !== ' ') {
        event.preventDefault();
        void speakCurrentWord(target);
        return;
      }
      if (!isPrintableKey(event.key) || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }
      event.preventDefault();
      if (!isActive) {
        setIsActive(true);
      }

      const expected = target[currentInput.length] ?? '';
      const typed = event.key;
      if (normalizeWord(typed, settings.ignoreCase) === normalizeWord(expected, settings.ignoreCase)) {
        const nextInput = currentInput + typed;
        const nextCorrectKeys = correctKeys + 1;
        const nextLetterTimes = [...letterTimes, performance.now()];
        setInputValue(nextInput);
        setCorrectKeys(nextCorrectKeys);
        setLetterTimes(nextLetterTimes);
        if (nextInput.length >= target.length) {
          void completeCurrentWord(nextLetterTimes, nextCorrectKeys);
        }
      } else {
        setWrongKeys((value) => value + 1);
        setCurrentWrongCount((value) => value + 1);
        setCurrentMistakes((value) => ({
          ...value,
          [currentInput.length]: [...(value[currentInput.length] ?? []), typed],
        }));
        setInputValue('');
      }
    },
    [
      completeCurrentWord,
      correctKeys,
      currentWord,
      isActive,
      isFinished,
      letterTimes,
      mode,
      resetRun,
      settings.ignoreCase,
      setInputValue,
      speakCurrentWord,
      target,
    ],
  );

  const createReview = async () => {
    const records = await db.wordRecords.where('wrongCount').above(0).toArray();
    const sourceWords = new Map(currentWords.map((word) => [word.name, word]));
    const unique = new Map<string, WordEntry>();
    records
      .sort((a, b) => b.wrongCount - a.wrongCount)
      .forEach((record) => {
        unique.set(record.word, sourceWords.get(record.word) ?? { name: record.word, trans: ['错题复习'] });
      });
    const words = [...unique.values()].slice(0, 20);
    if (!words.length) {
      message.info('当前还没有错词记录');
      return;
    }
    setReviewWords(words);
    await db.reviewSessions.add({
      dict: 'review',
      index: 0,
      createTime: Date.now(),
      isFinished: false,
      words,
    });
    resetRun('review');
  };

  const handleUpload = async () => {
    const file = (uploadFile?.originFileObj ?? uploadFile) as unknown as File | undefined;
    if (!file) {
      message.warning('请选择 Excel 或 JSON 词库文件');
      return;
    }
    const values = await form.validateFields();
    setUploading(true);
    try {
      await uploadDictionaryUsingPost({}, values, file);
      message.success('词库已上传');
      setUploadOpen(false);
      setUploadFile(null);
      form.resetFields();
      await loadDictionaries();
    } catch (error: any) {
      message.error(`上传失败：${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDictionary = async (id?: number) => {
    if (!id) {
      return;
    }
    try {
      await deleteDictionaryUsingPost({ id });
      message.success('词库已删除');
      if (String(id) === currentDictId) {
        setCurrentDictId('');
        setCurrentWords([]);
      }
      await loadDictionaries();
    } catch (error: any) {
      message.error(`删除失败：${error.message}`);
    }
  };

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings({ ...settings, [key]: value });
  };

  const ownedByMe = (dictionary: API.QwertyDictionaryVO) =>
    dictionary.userId && dictionary.userId === initialState?.currentUser?.id;

  return (
    <PageContainer title={false}>
      <div className={`qwerty-trainer-page ${settings.darkMode ? 'dark' : ''}`}>
        <header className="qwerty-topbar">
          <div>
            <div className="qwerty-eyebrow">Keyboard Memory Trainer</div>
            <h1>Qwerty Trainer</h1>
          </div>
          <Space wrap>
            <Button icon={<BookOutlined />} onClick={() => setLibraryDrawerOpen(true)}>
              词库 / 数据
            </Button>
            <Button icon={<BarChartOutlined />} onClick={() => setStatsDrawerOpen(true)}>
              统计 / 错词
            </Button>
            <Button icon={<DownloadOutlined />} onClick={downloadSampleDictionary}>
              下载示例 Excel
            </Button>
            <Button icon={<UploadOutlined />} type="primary" onClick={() => setUploadOpen(true)}>
              上传词库
            </Button>
            <Button icon={<SettingOutlined />} onClick={() => setSettingsOpen(true)}>
              训练设置
            </Button>
          </Space>
        </header>

        <main className="qwerty-workspace">
          <Drawer
            title="词库 / 数据"
            placement="left"
            open={libraryDrawerOpen}
            onClose={() => setLibraryDrawerOpen(false)}
            width={380}
            rootClassName={`qwerty-drawer-root ${settings.darkMode ? 'dark' : ''}`}
          >
            <div className="qwerty-sidebar">
            <section className="qwerty-panel">
              <div className="qwerty-panel-title">
                <BookOutlined />
                <span>服务器词库</span>
              </div>
              <List
                loading={dictionaryLoading}
                dataSource={dictionaryMetas}
                locale={{ emptyText: <Empty description="暂无词库，请先上传 Excel 词库" /> }}
                renderItem={(item) => (
                  <List.Item
                    className={`qwerty-dictionary-item ${
                      String(item.id) === currentDictId ? 'active' : ''
                    }`}
                    onClick={() => {
                      if (item.id) {
                        setCurrentDictId(String(item.id));
                      }
                    }}
                    actions={[
                      ownedByMe(item) ? (
                        <Popconfirm
                          key="delete"
                          title="删除这个词库？"
                          onConfirm={(event) => {
                            event?.stopPropagation();
                            void handleDeleteDictionary(item.id);
                          }}
                        >
                          <Button
                            danger
                            size="small"
                            type="text"
                            icon={<DeleteOutlined />}
                            onClick={(event) => event.stopPropagation()}
                          />
                        </Popconfirm>
                      ) : null,
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space size={6} wrap>
                          <span>{item.name}</span>
                          <Tag color={item.visibility === 'public' ? 'blue' : 'default'}>
                            {item.visibility === 'public' ? '公开' : '私有'}
                          </Tag>
                        </Space>
                      }
                      description={`${item.category ?? 'Custom'} · ${item.wordCount ?? 0} 词`}
                    />
                  </List.Item>
                )}
              />
            </section>

            <section className="qwerty-panel compact">
              <div className="qwerty-panel-title">
                <DatabaseOutlined />
                <span>本地数据</span>
              </div>
              <Space direction="vertical" className="qwerty-full">
                <Button block icon={<ReloadOutlined />} onClick={() => void createReview()}>
                  错词复习
                </Button>
                <Button block onClick={() => void refreshStats()}>
                  刷新统计
                </Button>
              </Space>
            </section>
            </div>
          </Drawer>

          <section className="qwerty-training">
            <div className="qwerty-training-toolbar">
              <div>
                <div className="qwerty-eyebrow">
                  {mode === 'review' ? '错词复习' : mode === 'dictation' ? '默写模式' : '章节训练'}
                </div>
                <h2>{currentDict?.name ?? '请选择词库'}</h2>
              </div>
              <Space wrap>
                <Tooltip title="上一章">
                  <Button
                    icon={<LeftOutlined />}
                    disabled={mode === 'review' || currentChapter <= 0}
                    onClick={() => setCurrentChapter(Math.max(0, currentChapter - 1))}
                  />
                </Tooltip>
                <Select
                  value={currentChapter}
                  disabled={mode === 'review' || !currentDict}
                  style={{ width: 132 }}
                  options={Array.from({ length: chapterCount }, (_, index) => ({
                    value: index,
                    label: `Chapter ${index + 1}`,
                  }))}
                  onChange={(value) => setCurrentChapter(value)}
                />
                <Tooltip title="下一章">
                  <Button
                    icon={<RightOutlined />}
                    disabled={mode === 'review' || currentChapter >= chapterCount - 1}
                    onClick={() => setCurrentChapter(Math.min(chapterCount - 1, currentChapter + 1))}
                  />
                </Tooltip>
              </Space>
            </div>

            <div
              ref={surfaceRef}
              className={`qwerty-surface ${settings.selectableText ? '' : 'no-select'}`}
              tabIndex={0}
              role="application"
              aria-label="打字训练区域"
              onKeyDown={handleKeyDown}
              onKeyUp={(event) => {
                if (event.key === 'Tab') {
                  setShowAnswerByTab(false);
                }
              }}
            >
              {wordLoading ? (
                <Empty description="词库加载中" />
              ) : !trainingWords.length ? (
                <Empty description="当前词库没有可训练词条" />
              ) : (
                <>
                  <div className="qwerty-progress-row">
                    <span>
                      {Math.min(unitIndex + 1, totalUnits)} / {totalUnits}
                      {settings.loopTimes > 1 ? ` · 第 ${repeatIndex}/${settings.loopTimes} 次` : ''}
                    </span>
                    <Progress percent={progress} showInfo={false} />
                    <span>{progress}%</span>
                  </div>

                  {settings.showNeighbors && (
                    <div className="qwerty-neighbors">
                      <span>{trainingWords[wordIndex - 1]?.name ?? ' '}</span>
                      <span>{trainingWords[wordIndex + 1]?.name ?? ' '}</span>
                    </div>
                  )}

                  <div className={`qwerty-word-card ${isFinished ? 'finished' : ''}`}>
                    <div className="qwerty-word-actions">
                      <Tooltip title="朗读单词">
                        <Button
                          shape="circle"
                          icon={<SoundOutlined />}
                          onClick={(event) => {
                            event.stopPropagation();
                            void speakCurrentWord(target);
                            window.setTimeout(() => surfaceRef.current?.focus(), 0);
                          }}
                        />
                      </Tooltip>
                      <Tooltip title="跳过单词">
                        <Button shape="circle" icon={<StepForwardOutlined />} onClick={skipWord} />
                      </Tooltip>
                    </div>
                    <div className={`qwerty-word-display ${shouldHideWord && !showAnswerByTab ? 'hidden' : ''}`}>
                      {answerVisible ? renderWordCharacters(target, input) : '按 Tab 查看答案'}
                    </div>
                    {settings.showPhonetic && (
                      <div className="qwerty-phonetic">
                        {currentWord?.usphone ? `美 /${currentWord.usphone}/` : '音标未收录'}
                        {currentWord?.ukphone ? ` · 英 /${currentWord.ukphone}/` : ''}
                      </div>
                    )}
                    <div className={`qwerty-translation ${shouldHideTrans && !showAnswerByTab ? 'hidden' : ''}`}>
                      {shouldHideTrans && !showAnswerByTab
                        ? '释义已隐藏'
                        : currentWord?.trans.join('；') || '暂无释义'}
                    </div>
                    <div className="qwerty-input-hint">
                      {input || '点击训练区域后直接键入；Enter 开始，Space 发音，Tab 显示答案'}
                    </div>
                  </div>

                  <div className="qwerty-metrics">
                    <Metric label="WPM" value={wpm} />
                    <Metric label="准确率" value={`${accuracy}%`} />
                    <Metric label="耗时" value={`${elapsed}s`} />
                    <Metric label="错误键" value={wrongKeys} />
                  </div>

                  {isFinished && (
                    <div className="qwerty-result">
                      <div>
                        <h3>本轮完成</h3>
                        <p>
                          {totalUnits} 个输入单元，WPM {wpm}，准确率 {accuracy}%。
                        </p>
                      </div>
                      <Space wrap>
                        <Button icon={<ReloadOutlined />} onClick={() => resetRun(mode)}>
                          重复本章
                        </Button>
                        {mode !== 'dictation' && (
                          <Button
                            icon={<EyeInvisibleOutlined />}
                            onClick={() => {
                              setSettings({ ...settings, dictationMode: true });
                              resetRun('dictation');
                            }}
                          >
                            默写本章
                          </Button>
                        )}
                        <Button
                          type="primary"
                          icon={<RightOutlined />}
                          onClick={() => {
                            setCurrentChapter(Math.min(chapterCount - 1, currentChapter + 1));
                            resetRun('practice');
                          }}
                        >
                          下一章
                        </Button>
                      </Space>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          <Drawer
            title="统计 / 错词"
            placement="right"
            open={statsDrawerOpen}
            onClose={() => setStatsDrawerOpen(false)}
            width={420}
            forceRender
            rootClassName={`qwerty-drawer-root ${settings.darkMode ? 'dark' : ''}`}
          >
            <div className="qwerty-stats">
            <section className="qwerty-panel">
              <div className="qwerty-panel-title">
                <BarChartOutlined />
                <span>统计</span>
              </div>
              <div className="qwerty-metrics two">
                <Metric label="累计词数" value={stats?.totalWords ?? 0} />
                <Metric label="平均 WPM" value={stats?.averageWpm ?? 0} />
                <Metric label="平均准确率" value={`${stats?.averageAccuracy ?? 100}%`} />
                <Metric label="练习次数" value={stats?.chapterRecords.length ?? 0} />
              </div>
              <div ref={chartRef} className="qwerty-chart" aria-label="最近训练趋势图" />
              <div className="qwerty-heatmap" aria-label="最近二十八天练习热力图">
                {Array.from({ length: 28 }, (_, index) => {
                  const day = new Date();
                  day.setDate(day.getDate() - (27 - index));
                  const count =
                    stats?.chapterRecords.filter(
                      (record) => new Date(record.timestamp).toDateString() === day.toDateString(),
                    ).length ?? 0;
                  return (
                    <span
                      key={index}
                      className={`heat heat-${Math.min(4, count)}`}
                      title={`${day.toLocaleDateString()}：${count} 次`}
                    />
                  );
                })}
              </div>
            </section>

            <section className="qwerty-panel compact">
              <div className="qwerty-panel-title">
                <ReloadOutlined />
                <span>高频错词</span>
              </div>
              {stats?.wrongWords.length ? (
                <div className="qwerty-wrong-list">
                  {stats.wrongWords.map((item) => (
                    <div key={item.word} className="qwerty-wrong-item">
                      <span>{item.word}</span>
                      <strong>{item.count}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="还没有错词" />
              )}
            </section>
            </div>
          </Drawer>
        </main>

        <Modal
          title="上传 Excel 词库"
          open={uploadOpen}
          onOk={handleUpload}
          okText="上传"
          confirmLoading={uploading}
          onCancel={() => setUploadOpen(false)}
          destroyOnClose
        >
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              category: 'Custom',
              language: 'en',
              languageCategory: 'custom',
              visibility: 'private',
            }}
          >
            <Form.Item name="name" label="词库名称" rules={[{ required: true, message: '请输入词库名称' }]}>
              <Input maxLength={80} />
            </Form.Item>
            <Form.Item name="description" label="描述">
              <Input.TextArea rows={2} maxLength={300} />
            </Form.Item>
            <Form.Item name="category" label="分类" rules={[{ required: true }]}>
              <Input maxLength={80} />
            </Form.Item>
            <Form.Item name="language" label="语言" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'ja', label: 'Japanese' },
                  { value: 'code', label: 'Code' },
                  { value: 'custom', label: 'Custom' },
                ]}
              />
            </Form.Item>
            <Form.Item name="languageCategory" label="语言分类" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'ja', label: 'Japanese' },
                  { value: 'code', label: 'Code' },
                  { value: 'custom', label: 'Custom' },
                ]}
              />
            </Form.Item>
            <Form.Item name="visibility" label="可见性" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: 'private', label: '仅本人可见' },
                  { value: 'public', label: '公开' },
                ]}
              />
            </Form.Item>
            <Form.Item label="Excel / JSON 文件" required>
              <Upload
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/json,.json"
                maxCount={1}
                fileList={uploadFile ? [uploadFile] : []}
                beforeUpload={(file) => {
                  setUploadFile(file as unknown as UploadFile);
                  return false;
                }}
                onRemove={() => setUploadFile(null)}
              >
                <Button icon={<UploadOutlined />}>选择文件</Button>
              </Upload>
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="训练设置"
          open={settingsOpen}
          footer={null}
          onCancel={() => setSettingsOpen(false)}
          destroyOnClose
        >
          <div className="qwerty-settings-grid">
            <SettingSwitch
              label="深色模式"
              checked={settings.darkMode}
              onChange={(checked) => updateSetting('darkMode', checked)}
            />
            <SettingSwitch
              label="显示音标"
              checked={settings.showPhonetic}
              onChange={(checked) => updateSetting('showPhonetic', checked)}
            />
            <SettingSwitch
              label="显示前后词"
              checked={settings.showNeighbors}
              onChange={(checked) => updateSetting('showNeighbors', checked)}
            />
            <SettingSwitch
              label="允许选中文本"
              checked={settings.selectableText}
              onChange={(checked) => updateSetting('selectableText', checked)}
            />
            <SettingSwitch
              label="忽略大小写"
              checked={settings.ignoreCase}
              onChange={(checked) => updateSetting('ignoreCase', checked)}
            />
            <SettingSwitch
              label="章节乱序"
              checked={settings.randomOrder}
              onChange={(checked) => updateSetting('randomOrder', checked)}
            />
            <SettingSwitch
              label="默写模式"
              checked={settings.dictationMode}
              onChange={(checked) => updateSetting('dictationMode', checked)}
            />
            <SettingSwitch
              label="循环发音"
              checked={settings.pronounceLoop}
              onChange={(checked) => updateSetting('pronounceLoop', checked)}
            />
            <label className="qwerty-setting-field">
              <span>单词循环次数</span>
              <InputNumber
                min={1}
                max={5}
                value={settings.loopTimes}
                onChange={(value) => updateSetting('loopTimes', Math.max(1, Math.min(5, Number(value ?? 1))))}
              />
            </label>
            <label className="qwerty-setting-field">
              <span>发音口音</span>
              <Select
                value={settings.pronounceLang}
                onChange={(value) => updateSetting('pronounceLang', value)}
                options={[
                  { value: 'en-US', label: '美音' },
                  { value: 'en-GB', label: '英音' },
                  { value: 'ja-JP', label: '日语' },
                ]}
              />
            </label>
            <label className="qwerty-setting-field">
              <span>默写隐藏</span>
              <Select
                value={settings.hideInDictation}
                onChange={(value) => updateSetting('hideInDictation', value)}
                options={[
                  { value: 'word', label: '隐藏单词' },
                  { value: 'trans', label: '隐藏释义' },
                  { value: 'all', label: '全部隐藏' },
                ]}
              />
            </label>
          </div>
        </Modal>
      </div>
    </PageContainer>
  );
};

export default QwertyTrainer;
