export const STORAGE_KEY = 'ai_quiz_data';

export function saveQuizData(data: any) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadQuizData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearQuizData() {
  localStorage.removeItem(STORAGE_KEY);
}
